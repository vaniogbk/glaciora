import request from 'supertest';
import { app, CSRF, createUser, loginAgent, proofOf, resetDb, seedCatalogue } from './helpers';
import { prisma } from '../src/lib/prisma';

afterAll(() => prisma.$disconnect());
beforeEach(resetDb);

// IBAN d'exemple publié (documentation bancaire allemande) : aucun compte réel.
const DE_EXAMPLE = 'DE89 3704 0044 0532 0130 00';

describe('coordonnées bancaires par pays', () => {
  it('réserve la gestion des comptes aux admins', async () => {
    const { email, password } = await createUser('CLIENT');
    const client = await loginAgent(email, password);
    expect((await client.get('/api/admin/bank-accounts')).status).toBe(403);
    expect((await request(app).get('/api/admin/bank-accounts')).status).toBe(401);
  });

  it('refuse un IBAN invalide et accepte un même pays sur plusieurs comptes', async () => {
    const { email, password } = await createUser('ADMIN');
    const admin = await loginAgent(email, password);
    const bad = await admin.post('/api/admin/bank-accounts').set(CSRF).send({ label: 'Allemagne', accountHolder: 'GLACIORA', iban: 'DE00 1234', countryCodes: ['DE'] });
    expect(bad.status).toBe(400);
    const ok = await admin.post('/api/admin/bank-accounts').set(CSRF).send({ label: 'Allemagne', accountHolder: 'GLACIORA', iban: DE_EXAMPLE, countryCodes: ['DE', 'AT'] });
    expect(ok.status).toBe(201);
    expect(ok.body.account.ibanMasked).toBe('DE89 •••• 3000');
    const shared = await admin.post('/api/admin/bank-accounts').set(CSRF).send({ label: 'Autriche', accountHolder: 'GLACIORA', iban: DE_EXAMPLE, countryCodes: ['AT'] });
    expect(shared.status).toBe(201);
    const unknown = await admin.post('/api/admin/bank-accounts').set(CSRF).send({ label: 'Inconnu', accountHolder: 'GLACIORA', iban: DE_EXAMPLE, countryCodes: ['ZZ'] });
    expect(unknown.status).toBe(422);
    // Chaque modification est journalisée (IBAN masqué) et notifiée à la boutique.
    const log = await prisma.activityLog.findFirstOrThrow({ where: { action: 'bank_account.created' } });
    expect(JSON.stringify(log.metadata)).not.toContain('0532013000');
    const alert = await prisma.emailMessage.findFirstOrThrow({ where: { template: 'bank-account-changed' } });
    expect(alert.toAddress).toBe('glaciora@outlook.com');
  });

  it('affiche le compte du pays de livraison, sinon le compte par défaut', async () => {
    const seeded = await seedCatalogue(3);
    await prisma.shippingCountry.create({ data: { code: 'DE', name: 'Allemagne', isEnabled: true, zoneId: (await prisma.shippingRate.findUniqueOrThrow({ where: { id: seeded.rate.id } })).zoneId } });
    await prisma.bankAccount.create({ data: { label: 'Allemagne', accountHolder: 'GLACIORA GmbH', iban: 'DE89370400440532013000', bic: 'COBADEFFXXX', countryCodes: ['DE'] } });
    const agent = request.agent(app);
    await agent.post('/api/cart/items').set(CSRF).send({ variantId: seeded.variant.id, quantity: 1 });

    const de = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'DE', shippingRateId: seeded.rate.id });
    expect(de.body.bank).toMatchObject({ accountHolder: 'GLACIORA GmbH', iban: 'DE89 3704 0044 0532 0130 00', bic: 'COBADEFFXXX' });
    const fr = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: seeded.rate.id });
    expect(fr.body.bank.iban).toBe('FR76 3000 6000 0112 3456 7890 189');

    const shown = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'DE', shippingRateId: seeded.rate.id });
    const order = await agent
      .post('/api/checkout/orders')
      .set(CSRF)
      .field('data', JSON.stringify({ email: 'max@glaciora.test', shippingAddress: { firstName: 'Max', lastName: 'Muster', line1: 'Hauptstr. 1', postalCode: '80331', city: 'München', countryCode: 'DE', phone: '+49 89 000000' }, shippingRateId: seeded.rate.id, paymentMethod: 'BANK_TRANSFER', acceptTerms: true }))
      .attach('proof', proofOf(shown), { filename: 'beleg.pdf', contentType: 'application/pdf' });
    expect(order.status).toBe(201);
    const payment = await prisma.payment.findFirstOrThrow({ where: { order: { reference: order.body.order.reference } } });
    expect(payment.receivingAccount).toBe('Allemagne — DE89 •••• 3000');
  });

  it('répartit les commandes entre les comptes d’un même pays et garde le compte affiché au client', async () => {
    const seeded = await seedCatalogue(5);
    const zoneId = (await prisma.shippingRate.findUniqueOrThrow({ where: { id: seeded.rate.id } })).zoneId;
    await prisma.shippingCountry.create({ data: { code: 'DE', name: 'Allemagne', isEnabled: true, zoneId } });
    const first = await prisma.bankAccount.create({ data: { label: 'Allemagne 1', accountHolder: 'GLACIORA', iban: 'DE89370400440532013000', countryCodes: ['DE'], createdAt: new Date('2026-01-01') } });
    const second = await prisma.bankAccount.create({ data: { label: 'Allemagne 2', accountHolder: 'GLACIORA', iban: 'DE02120300000000202051', countryCodes: ['DE', 'AT'], createdAt: new Date('2026-01-02') } });
    const orderData = JSON.stringify({ email: 'max@glaciora.test', shippingAddress: { firstName: 'Max', lastName: 'Muster', line1: 'Hauptstr. 1', postalCode: '80331', city: 'München', countryCode: 'DE', phone: '+49 89 000000' }, shippingRateId: seeded.rate.id, paymentMethod: 'BANK_TRANSFER', acceptTerms: true });

    async function checkout() {
      const agent = request.agent(app);
      await agent.post('/api/cart/items').set(CSRF).send({ variantId: seeded.variant.id, quantity: 1 });
      const details = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'DE', shippingRateId: seeded.rate.id });
      return { agent, iban: details.body.bank.iban as string, details };
    }
    const place = (shown: { agent: ReturnType<typeof request.agent>; details: { body: { reference: string; amountCents: number } } }) =>
      shown.agent.post('/api/checkout/orders').set(CSRF).field('data', orderData).attach('proof', proofOf(shown.details), { filename: 'beleg.pdf', contentType: 'application/pdf' });

    const a = await checkout();
    expect(a.iban).toBe('DE89 3704 0044 0532 0130 00');
    expect((await place(a)).status).toBe(201);

    // Le premier compte vient de recevoir une commande : le suivant est proposé, et reste le même si les coordonnées sont réaffichées.
    const b = await checkout();
    expect(b.iban).toBe('DE02 1203 0000 0000 2020 51');
    const again = await b.agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'DE', shippingRateId: seeded.rate.id });
    expect(again.body.bank.iban).toBe('DE02 1203 0000 0000 2020 51');

    // Désactivé entre l'affichage et la validation : la commande garde le compte que le client a vu (et payé).
    await prisma.bankAccount.update({ where: { id: second.id }, data: { isActive: false } });
    const placed = await place(b);
    expect(placed.status).toBe(201);
    const payments = await prisma.payment.findMany({ orderBy: { createdAt: 'asc' }, select: { bankAccountId: true } });
    expect(payments.map((p) => p.bankAccountId)).toEqual([first.id, second.id]);
  });
});
