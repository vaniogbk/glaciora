import request from 'supertest';
import { app, CSRF, PDF_BYTES, createUser, loginAgent, resetDb, seedCatalogue } from './helpers';
import { prisma } from '../src/lib/prisma';

afterAll(() => prisma.$disconnect());
beforeEach(resetDb);

const address = {
  firstName: 'Léa',
  lastName: 'Martin',
  line1: '1 rue des Alpes',
  postalCode: '74400',
  city: 'Chamonix',
  countryCode: 'FR',
  phone: '+33 6 00 00 00 00',
};

async function cartWith(quantity: number) {
  const seeded = await seedCatalogue(2);
  const agent = request.agent(app);
  const add = await agent.post('/api/cart/items').set(CSRF).send({ variantId: seeded.variant.id, quantity });
  return { ...seeded, agent, add };
}

function orderData(rateId: string) {
  return JSON.stringify({ email: 'lea@glaciora.test', shippingAddress: address, shippingRateId: rateId, paymentMethod: 'BANK_TRANSFER', acceptTerms: true });
}

describe('panier et stock', () => {
  it('refuse une quantité supérieure au stock', async () => {
    const { add } = await cartWith(3);
    expect(add.status).toBe(422);
    expect(add.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('ajoute, modifie et supprime un article avec recalcul du total', async () => {
    const { agent, add, variant } = await cartWith(1);
    expect(add.status).toBe(201);
    expect(add.body.cart.subtotalCents).toBe(44990);
    const updated = await agent.patch(`/api/cart/items/${variant.id}`).set(CSRF).send({ quantity: 2 });
    expect(updated.body.cart).toMatchObject({ subtotalCents: 89980, itemCount: 2 });
    const removed = await agent.delete(`/api/cart/items/${variant.id}`).set(CSRF);
    expect(removed.body.cart.items).toHaveLength(0);
  });

  it('refuse un produit non publié', async () => {
    const { product, agent, variant } = await cartWith(1);
    await prisma.product.update({ where: { id: product.id }, data: { status: 'DRAFT' } });
    const res = await agent.post('/api/cart/items').set(CSRF).send({ variantId: variant.id, quantity: 1 });
    expect(res.status).toBe(404);
  });
});

describe('checkout par virement', () => {
  it('affiche la carte comme indisponible', async () => {
    const res = await request(app).get('/api/checkout/config');
    const card = res.body.paymentMethods.find((m: { id: string }) => m.id === 'CARD');
    expect(card).toMatchObject({ available: false, unavailableReason: 'Indisponible pour le moment' });
  });

  it('crée la commande avec justificatif, réserve le stock et met les e-mails en file', async () => {
    const { agent, rate, variant } = await cartWith(1);
    const details = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
    expect(details.status).toBe(200);
    expect(details.body.amountCents).toBe(44990 + 990);
    expect(details.body.bank.iban).toBe('FR76 3000 6000 0112 3456 7890 189');
    expect(details.body.qrCodeDataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(details.body.reference).toMatch(/^GLA-\d{6}-[A-Z0-9]{5}$/);

    const res = await agent
      .post('/api/checkout/orders')
      .set(CSRF)
      .field('data', orderData(rate.id))
      .attach('proof', PDF_BYTES, { filename: 'virement.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(201);
    expect(res.body.order).toMatchObject({ reference: details.body.reference, status: 'PENDING_PAYMENT_VERIFICATION', totalCents: 45980 });

    const order = await prisma.order.findUniqueOrThrow({ where: { reference: res.body.order.reference }, include: { proofs: true, payments: true, emails: true } });
    expect(order.proofs).toHaveLength(1);
    expect(order.proofs[0]!.storageKey).toMatch(/^proofs\/\d{4}\/\d{2}\/[a-f0-9-]+\.pdf$/);
    expect(order.payments[0]).toMatchObject({ method: 'BANK_TRANSFER', status: 'PENDING_VERIFICATION', amountCents: 45980 });
    expect(order.emails.map((e) => e.toAddress)).toContain('glacioara@outlook.fr');
    const adminMail = order.emails.find((e) => e.template === 'admin-transfer-proof')!;
    expect(JSON.stringify(adminMail.payload)).not.toContain('FR76');
    expect((await prisma.stock.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity).toBe(1);

    const confirmation = await agent.get(`/api/checkout/orders/${order.reference}`);
    expect(confirmation.status).toBe(200);
    expect(confirmation.body.order.proofReceived).toBe(true);
    // Un autre visiteur ne peut pas lire la commande.
    expect((await request(app).get(`/api/checkout/orders/${order.reference}`)).status).toBe(404);
  });

  it('exige un justificatif valide', async () => {
    const { agent, rate } = await cartWith(1);
    await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
    const missing = await agent.post('/api/checkout/orders').set(CSRF).field('data', orderData(rate.id));
    expect(missing.body.error.code).toBe('PROOF_REQUIRED');
    const fake = await agent
      .post('/api/checkout/orders')
      .set(CSRF)
      .field('data', orderData(rate.id))
      .attach('proof', Buffer.from('MZ fake executable'), { filename: 'virement.pdf', contentType: 'application/pdf' });
    expect(fake.status).toBe(422);
    expect(fake.body.error.code).toBe('PROOF_UNSUPPORTED_TYPE');
    expect(await prisma.order.count()).toBe(0);
  });

  it('refuse la commande si le montant a changé depuis l’affichage du QR code', async () => {
    const { agent, rate, variant } = await cartWith(1);
    await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
    await agent.patch(`/api/cart/items/${variant.id}`).set(CSRF).send({ quantity: 2 });
    const res = await agent
      .post('/api/checkout/orders')
      .set(CSRF)
      .field('data', orderData(rate.id))
      .attach('proof', PDF_BYTES, { filename: 'virement.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(409);
    expect(res.body.error.details.code).toBe('AMOUNT_CHANGED');
  });

  it('ne survend pas quand deux commandes visent le dernier article', async () => {
    const seeded = await seedCatalogue(1);
    const agents = [request.agent(app), request.agent(app)];
    for (const agent of agents) {
      await agent.post('/api/cart/items').set(CSRF).send({ variantId: seeded.variant.id, quantity: 1 });
      await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: seeded.rate.id });
    }
    const results = await Promise.all(
      agents.map((agent) =>
        agent.post('/api/checkout/orders').set(CSRF).field('data', orderData(seeded.rate.id)).attach('proof', PDF_BYTES, { filename: 'v.pdf', contentType: 'application/pdf' }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 422]);
    expect((await prisma.stock.findUniqueOrThrow({ where: { variantId: seeded.variant.id } })).quantity).toBe(0);
  });

  it('permet à l’admin de consulter le justificatif et de marquer la commande payée', async () => {
    const { agent, rate } = await cartWith(1);
    await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
    const created = await agent.post('/api/checkout/orders').set(CSRF).field('data', orderData(rate.id)).attach('proof', PDF_BYTES, { filename: 'v.pdf', contentType: 'application/pdf' });
    const order = await prisma.order.findUniqueOrThrow({ where: { reference: created.body.order.reference }, include: { proofs: true } });

    const anonymous = await request(app).get(`/api/admin/orders/${order.id}/proofs/${order.proofs[0]!.id}`);
    expect(anonymous.status).toBe(401);

    const { email, password } = await createUser('ADMIN');
    const admin = await loginAgent(email, password);
    const file = await admin.get(`/api/admin/orders/${order.id}/proofs/${order.proofs[0]!.id}`).buffer(true);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toBe('application/pdf');
    expect(file.headers['cache-control']).toContain('no-store');

    const invalid = await admin.patch(`/api/admin/orders/${order.id}/status`).set(CSRF).send({ status: 'SHIPPED' });
    expect(invalid.status).toBe(422);
    const paid = await admin.patch(`/api/admin/orders/${order.id}/status`).set(CSRF).send({ status: 'PAID' });
    expect(paid.status).toBe(200);
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.status).toBe('VERIFIED');
    expect(await prisma.activityLog.count({ where: { entityId: order.id, action: 'order.status_changed' } })).toBe(1);
  });
});
