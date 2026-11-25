import request from 'supertest';
import { app, CSRF, createUser, loginAgent, resetDb, seedCatalogue } from './helpers';
import { AppError } from '../src/lib/errors';
import { prisma } from '../src/lib/prisma';
import { setCardProvider, type CardPayment, type CardPaymentProvider, type CardPaymentStatus, type CreateCardPaymentInput } from '../src/modules/payments/card-provider';
import { sweepStaleCardPayments } from '../src/modules/checkout/card-checkout';
import { fromMollieAmount, toMollieAmount } from '../src/modules/payments/mollie';

/** Prestataire de test : garde les paiements en mémoire ; l'état « payé » n'est donné que par le test, comme Mollie. */
class FakeProvider implements CardPaymentProvider {
  readonly name = 'mollie';
  readonly testMode = true;
  readonly created: CreateCardPaymentInput[] = [];
  readonly payments = new Map<string, CardPayment>();
  failCreate = false;
  ready = true;

  async isReady() {
    return this.ready;
  }

  async createPayment(input: CreateCardPaymentInput) {
    if (this.failCreate) throw new AppError(503, 'CARD_UNAVAILABLE', 'Le paiement par carte est momentanément indisponible');
    this.created.push(input);
    const payment: CardPayment = {
      providerPaymentId: `tr_test${this.payments.size + 1}x`,
      status: 'open',
      amountCents: input.amountCents,
      currency: input.currency,
      testMode: true,
      metadata: input.metadata,
    };
    this.payments.set(payment.providerPaymentId, payment);
    return { ...payment, checkoutUrl: `https://www.mollie.com/checkout/test-mode?id=${payment.providerPaymentId}` };
  }

  async getPayment(id: string) {
    const payment = this.payments.get(id);
    if (!payment) throw new Error('paiement inconnu');
    return { ...payment };
  }

  set(id: string, status: CardPaymentStatus, changes: Partial<CardPayment> = {}) {
    this.payments.set(id, { ...this.payments.get(id)!, status, ...changes });
  }
}

const address = { firstName: 'Léa', lastName: 'Martin', line1: '1 rue des Alpes', postalCode: '74400', city: 'Chamonix', countryCode: 'FR', phone: '+33 6 00 00 00 00' };

let provider: FakeProvider;
beforeEach(async () => {
  await resetDb();
  provider = new FakeProvider();
  setCardProvider(provider);
});
afterAll(async () => {
  setCardProvider(undefined);
  await prisma.$disconnect();
});

async function cardOrder(quantity = 1) {
  const seeded = await seedCatalogue(2);
  const agent = request.agent(app);
  await agent.post('/api/cart/items').set(CSRF).send({ variantId: seeded.variant.id, quantity });
  const res = await agent
    .post('/api/checkout/card-orders')
    .set(CSRF)
    .send({ data: { email: 'lea@glaciora.test', shippingAddress: address, shippingRateId: seeded.rate.id, paymentMethod: 'CARD', acceptTerms: true, locale: 'de' } });
  return { ...seeded, agent, res };
}

const stockOf = async (variantId: string) => (await prisma.stock.findUniqueOrThrow({ where: { variantId } })).quantity;
const webhook = (id: string) => request(app).post('/api/payments/mollie/webhook').type('form').send({ id });

describe('paiement par carte (Mollie)', () => {
  it('montants Mollie sans virgule flottante', () => {
    expect(toMollieAmount(45980)).toBe('459.80');
    expect(toMollieAmount(5)).toBe('0.05');
    expect(fromMollieAmount('459.80')).toBe(45980);
    expect(() => fromMollieAmount('459.8')).toThrow();
  });

  it('propose la carte quand le prestataire est configuré, la refuse sinon', async () => {
    const on = await request(app).get('/api/checkout/config');
    expect(on.body.paymentMethods.find((m: { id: string }) => m.id === 'CARD')).toMatchObject({ available: true });
    setCardProvider(null);
    const off = await request(app).get('/api/checkout/config');
    expect(off.body.paymentMethods.find((m: { id: string }) => m.id === 'CARD')).toMatchObject({ available: false });
    const { res } = await cardOrder();
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('CARD_UNAVAILABLE');
  });

  it('masque la carte tant que Mollie n’a pas activé le moyen de paiement', async () => {
    provider.ready = false;
    const config = await request(app).get('/api/checkout/config');
    expect(config.body.paymentMethods.find((m: { id: string }) => m.id === 'CARD')).toMatchObject({ available: false });
    const { res, variant } = await cardOrder();
    expect(res.status).toBe(503);
    expect(await stockOf(variant.id)).toBe(2);
  });

  it('enregistre la commande en attente, réserve le stock, garde le panier et renvoie la page de paiement', async () => {
    const { res, variant, agent } = await cardOrder();
    expect(res.status).toBe(201);
    expect(res.body.order.checkoutUrl).toMatch(/^https:\/\/www\.mollie\.com\//);
    const order = await prisma.order.findUniqueOrThrow({ where: { reference: res.body.order.reference }, include: { payments: true } });
    expect(order.status).toBe('PENDING_PAYMENT_VERIFICATION');
    expect(order.payments[0]).toMatchObject({ method: 'CARD', status: 'PENDING_VERIFICATION', provider: 'mollie', providerPaymentId: 'tr_test1x', amountCents: 45980 });
    expect(await stockOf(variant.id)).toBe(1);
    expect(provider.created[0]).toMatchObject({ amountCents: 45980, currency: 'EUR', locale: 'de', webhookUrl: undefined });
    expect(provider.created[0]!.redirectUrl).toBe(`http://localhost:3000/de/commande/carte?ref=${order.reference}`);
    const cart = await agent.get('/api/cart');
    expect(cart.body.cart.items).toHaveLength(1);
    expect(await prisma.emailMessage.count({ where: { orderId: order.id } })).toBe(0);
  });

  it('webhook « payé » : commande en préparation, panier vidé, e-mails une seule fois', async () => {
    const { res, agent } = await cardOrder();
    const reference = res.body.order.reference as string;
    provider.set('tr_test1x', 'paid');
    expect((await webhook('tr_test1x')).status).toBe(200);
    expect((await webhook('tr_test1x')).status).toBe(200);
    const order = await prisma.order.findUniqueOrThrow({ where: { reference }, include: { payments: true } });
    expect(order.status).toBe('PREPARING');
    expect(order.paidAt).not.toBeNull();
    expect(order.payments[0]!.status).toBe('VERIFIED');
    const emails = await prisma.emailMessage.findMany({ where: { orderId: order.id }, orderBy: { template: 'asc' } });
    expect(emails.map((e) => e.template)).toEqual(['admin-card-paid', 'order-received']);
    expect(emails.find((e) => e.template === 'order-received')!.payload).toMatchObject({ paymentMethod: 'CARD', locale: 'de' });
    expect((await agent.get('/api/cart')).body.cart.items).toHaveLength(0);
    const state = await agent.get(`/api/checkout/card-orders/${reference}`);
    expect(state.body).toEqual({ reference, state: 'paid' });
  });

  it('refus, abandon ou expiration : commande annulée, stock rendu, panier conservé', async () => {
    const { res, variant, agent } = await cardOrder();
    provider.set('tr_test1x', 'canceled');
    const state = await agent.get(`/api/checkout/card-orders/${res.body.order.reference}`);
    expect(state.body.state).toBe('failed');
    await webhook('tr_test1x');
    const order = await prisma.order.findUniqueOrThrow({ where: { reference: res.body.order.reference }, include: { payments: true } });
    expect(order.status).toBe('CANCELLED');
    expect(order.payments[0]!.status).toBe('REJECTED');
    expect(await stockOf(variant.id)).toBe(2);
    expect(await prisma.stockMovement.count({ where: { orderId: order.id, type: 'ORDER_RELEASE' } })).toBe(1);
    expect((await agent.get('/api/cart')).body.cart.items).toHaveLength(1);
  });

  it('ne valide jamais un paiement dont le montant ou le mode ne correspondent pas', async () => {
    const { res } = await cardOrder();
    provider.set('tr_test1x', 'paid', { amountCents: 100 });
    await webhook('tr_test1x');
    provider.set('tr_test1x', 'paid', { amountCents: 45980, testMode: false });
    await webhook('tr_test1x');
    const order = await prisma.order.findUniqueOrThrow({ where: { reference: res.body.order.reference } });
    expect(order.status).toBe('PENDING_PAYMENT_VERIFICATION');
  });

  it('paiement impossible à créer chez Mollie : 503, commande annulée et stock rendu', async () => {
    provider.failCreate = true;
    const { res, variant } = await cardOrder();
    expect(res.status).toBe(503);
    expect(await stockOf(variant.id)).toBe(2);
    expect(await prisma.order.findFirstOrThrow()).toMatchObject({ status: 'CANCELLED' });
  });

  it('webhook sans en-tête CSRF accepté ; identifiant inconnu ou invalide ignoré', async () => {
    expect((await webhook('tr_inconnu1')).status).toBe(200);
    expect((await webhook('pas-un-id')).status).toBe(200);
  });

  it('le virement refuse une commande marquée carte', async () => {
    const seeded = await seedCatalogue(2);
    const agent = request.agent(app);
    await agent.post('/api/cart/items').set(CSRF).send({ variantId: seeded.variant.id, quantity: 1 });
    const data = JSON.stringify({ email: 'lea@glaciora.test', shippingAddress: address, shippingRateId: seeded.rate.id, paymentMethod: 'CARD', acceptTerms: true });
    const res = await agent.post('/api/checkout/orders').set(CSRF).field('data', data).attach('proof', Buffer.from('%PDF-1.7\n%%EOF'), 'preuve.pdf');
    expect(res.status).toBe(400);
  });

  it('l’admin ne peut pas marquer payée une commande carte que Mollie n’a pas confirmée', async () => {
    const { res } = await cardOrder();
    const order = await prisma.order.findUniqueOrThrow({ where: { reference: res.body.order.reference } });
    await createUser('ADMIN', { email: 'admin-carte@glaciora.test', password: 'Neige-Profonde-2026!' });
    const admin = await loginAgent('admin-carte@glaciora.test', 'Neige-Profonde-2026!');
    for (const status of ['PREPARING', 'SHIPPED']) {
      const moved = await admin.patch(`/api/admin/orders/${order.id}/status`).set(CSRF).send({ status });
      expect(moved.status).toBe(422);
      expect(moved.body.error.code).toBe('CARD_NOT_PAID');
    }
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    const reject = await admin.post(`/api/admin/orders/${order.id}/payments/${payment.id}/reject`).set(CSRF).send({ reason: 'test refus' });
    expect(reject.status).toBe(422);
  });

  it('tâche de fond : un paiement resté en attente puis expiré rend le stock', async () => {
    const { res, variant } = await cardOrder();
    provider.set('tr_test1x', 'expired');
    expect(await sweepStaleCardPayments(new Date())).toBe(0);
    expect(await sweepStaleCardPayments(new Date(Date.now() + 20 * 60_000))).toBe(1);
    expect(await prisma.order.findUniqueOrThrow({ where: { reference: res.body.order.reference } })).toMatchObject({ status: 'CANCELLED' });
    expect(await stockOf(variant.id)).toBe(2);
  });
});
