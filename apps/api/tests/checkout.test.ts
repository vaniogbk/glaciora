import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { app, CSRF, PDF_BYTES, createUser, loginAgent, plainTextProofReader, proofFor, proofOf, resetDb, seedCatalogue } from './helpers';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { orderTrackingToken } from '../src/modules/checkout/order-tracking';
import { setProofTextReader, shutdownProofReader } from '../src/modules/checkout/proof-check';

afterAll(async () => {
  await shutdownProofReader();
  await prisma.$disconnect();
});
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
      .attach('proof', proofOf(details), { filename: 'virement.pdf', contentType: 'application/pdf' })
      .attach('proof', PDF_BYTES, { filename: 'avis-banque.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(201);
    // Étape 1 du suivi dès le dépôt de la preuve.
    expect(res.body.order).toMatchObject({ reference: details.body.reference, status: 'PREPARING', totalCents: 45980 });

    const order = await prisma.order.findUniqueOrThrow({ where: { reference: res.body.order.reference }, include: { proofs: true, payments: true, emails: true } });
    expect(order.proofs).toHaveLength(2);
    expect(order.proofs[0]!.storageKey).toMatch(/^proofs\/\d{4}\/\d{2}\/[a-f0-9-]+\.pdf$/);
    expect(order.payments[0]).toMatchObject({ method: 'BANK_TRANSFER', status: 'PENDING_VERIFICATION', amountCents: 45980 });
    // Référence et montant trouvés dans le justificatif : résultat visible dans l'admin.
    expect(order.payments[0]!.proofCheck).toMatchObject({ status: 'MATCHED', methods: ['pdf'] });
    expect(order.emails.map((e) => e.toAddress)).toContain('glaciora@outlook.com');
    const adminMail = order.emails.find((e) => e.template === 'admin-transfer-proof')!;
    expect(JSON.stringify(adminMail.payload)).not.toContain('FR76');
    // Les preuves sont jointes à l'e-mail de la boutique (lues dans le stockage privé à l'envoi).
    expect((adminMail.payload as { attachments: unknown[] }).attachments).toHaveLength(2);
    const customerMail = order.emails.find((e) => e.template === 'order-received')!;
    expect((customerMail.payload as { orderUrl: string }).orderUrl).toBe(`http://localhost:3000/commande/suivi?ref=${order.reference}&t=${orderTrackingToken(order.id)}`);
    expect((await prisma.stock.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity).toBe(1);

    const confirmation = await agent.get(`/api/checkout/orders/${order.reference}`);
    expect(confirmation.status).toBe(200);
    expect(confirmation.body.order.proofReceived).toBe(true);
    // Un autre visiteur ne peut pas lire la commande, sauf avec le lien de suivi signé des e-mails.
    expect((await request(app).get(`/api/checkout/orders/${order.reference}`)).status).toBe(404);
    expect((await request(app).get(`/api/checkout/orders/${order.reference}?t=faux-jeton`)).status).toBe(404);
    const tracked = await request(app).get(`/api/checkout/orders/${order.reference}?t=${orderTrackingToken(order.id)}`);
    expect(tracked.status).toBe(200);
    expect(tracked.body.order.status).toBe('PREPARING');
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
    const details = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
    await agent.patch(`/api/cart/items/${variant.id}`).set(CSRF).send({ quantity: 2 });
    const res = await agent
      .post('/api/checkout/orders')
      .set(CSRF)
      .field('data', orderData(rate.id))
      .attach('proof', proofOf(details), { filename: 'virement.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(409);
    expect(res.body.error.details.code).toBe('AMOUNT_CHANGED');
  });

  it('ne survend pas quand deux commandes visent le dernier article', async () => {
    const seeded = await seedCatalogue(1);
    const agents = [request.agent(app), request.agent(app)];
    const proofs: Buffer[] = [];
    for (const agent of agents) {
      await agent.post('/api/cart/items').set(CSRF).send({ variantId: seeded.variant.id, quantity: 1 });
      proofs.push(proofOf(await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: seeded.rate.id })));
    }
    const results = await Promise.all(
      agents.map((agent, i) =>
        agent.post('/api/checkout/orders').set(CSRF).field('data', orderData(seeded.rate.id)).attach('proof', proofs[i]!, { filename: 'v.pdf', contentType: 'application/pdf' }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 422]);
    expect((await prisma.stock.findUniqueOrThrow({ where: { variantId: seeded.variant.id } })).quantity).toBe(0);
  });

  it('permet à l’admin de consulter le justificatif et de passer la commande « En route »', async () => {
    const { agent, rate } = await cartWith(1);
    const details = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
    const created = await agent.post('/api/checkout/orders').set(CSRF).field('data', orderData(rate.id)).attach('proof', proofOf(details), { filename: 'v.pdf', contentType: 'application/pdf' });
    const order = await prisma.order.findUniqueOrThrow({ where: { reference: created.body.order.reference }, include: { proofs: true } });

    const anonymous = await request(app).get(`/api/admin/orders/${order.id}/proofs/${order.proofs[0]!.id}`);
    expect(anonymous.status).toBe(401);

    const { email, password } = await createUser('ADMIN');
    const admin = await loginAgent(email, password);
    const file = await admin.get(`/api/admin/orders/${order.id}/proofs/${order.proofs[0]!.id}`).buffer(true);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toBe('application/pdf');
    expect(file.headers['cache-control']).toContain('no-store');

    const invalid = await admin.patch(`/api/admin/orders/${order.id}/status`).set(CSRF).send({ status: 'PAID' });
    expect(invalid.status).toBe(422);
    const paid = await admin.patch(`/api/admin/orders/${order.id}/status`).set(CSRF).send({ status: 'SHIPPED' });
    expect(paid.status).toBe(200);
    const payment = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
    expect(payment.status).toBe('VERIFIED');
    expect(await prisma.activityLog.count({ where: { entityId: order.id, action: 'order.status_changed' } })).toBe(1);
  });
});

describe('contrôle automatique du justificatif', () => {
  const storedProofs = () => {
    const root = path.resolve(env.STORAGE_LOCAL_DIR, 'proofs');
    return fs.existsSync(root) ? fs.readdirSync(root, { recursive: true }).filter((f) => String(f).includes('.')).length : 0;
  };
  const place = (agent: ReturnType<typeof request.agent>, rateId: string, file: Buffer, contentType = 'application/pdf', filename = 'virement.pdf') =>
    agent.post('/api/checkout/orders').set(CSRF).field('data', orderData(rateId)).attach('proof', file, { filename, contentType });

  it('refuse un justificatif dont le montant ou la référence ne correspond pas, sans rien enregistrer', async () => {
    const { agent, rate, variant } = await cartWith(1);
    const details = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
    const before = storedProofs();

    const wrongAmount = await place(agent, rate.id, proofFor(details.body.reference, details.body.amountCents - 100));
    expect(wrongAmount.status).toBe(422);
    expect(wrongAmount.body.error.code).toBe('PROOF_MISMATCH');
    expect(wrongAmount.body.error.details).toMatchObject({ referenceFound: true, amountFound: false });
    expect(wrongAmount.body.error.message).toMatch(/459,80\s€/);

    const wrongReference = await place(agent, rate.id, proofFor('GLA-261109-ABCDE', details.body.amountCents));
    expect(wrongReference.body.error.details).toMatchObject({ referenceFound: false, amountFound: true });
    expect(wrongReference.body.error.message).toContain(details.body.reference);

    const neither = await place(agent, rate.id, proofFor('GLA-261109-ABCDE', 1000));
    expect(neither.body.error.details).toMatchObject({ referenceFound: false, amountFound: false });

    expect(await prisma.order.count()).toBe(0);
    expect(storedProofs()).toBe(before);
    expect((await prisma.stock.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity).toBe(2);

    // Le bon justificatif est ensuite accepté, avec la même référence.
    const ok = await place(agent, rate.id, proofOf(details));
    expect(ok.status).toBe(201);
    expect(ok.body.order.reference).toBe(details.body.reference);
  });

  it('refuse un justificatif illisible', async () => {
    const { agent, rate } = await cartWith(1);
    await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
    const res = await place(agent, rate.id, PDF_BYTES);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PROOF_UNREADABLE');
    expect(await prisma.order.count()).toBe(0);
  });

  it('lit vraiment le fichier : un document sans rapport (image lue par OCR) est refusé', async () => {
    setProofTextReader(undefined);
    try {
      const { agent, rate } = await cartWith(1);
      await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
      const res = await place(agent, rate.id, fs.readFileSync(path.join(__dirname, 'fixtures', 'sans-rapport.png')), 'image/png', 'recu.png');
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('PROOF_MISMATCH');
      expect(await prisma.order.count()).toBe(0);
    } finally {
      setProofTextReader(plainTextProofReader);
    }
  });

  it('panne du lecteur : « réessayez » (503), sans refuser le justificatif ni créer la commande', async () => {
    setProofTextReader(async () => {
      throw new Error('lecteur OCR indisponible');
    });
    try {
      const { agent, rate } = await cartWith(1);
      const details = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
      const res = await place(agent, rate.id, proofOf(details));
      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('PROOF_CHECK_UNAVAILABLE');
      expect(await prisma.order.count()).toBe(0);
    } finally {
      setProofTextReader(plainTextProofReader);
    }
  });

  it('peut être désactivé (PROOF_AUTO_CHECK=false) : commande acceptée et marquée « contrôle désactivé »', async () => {
    env.PROOF_AUTO_CHECK = false;
    try {
      const { agent, rate } = await cartWith(1);
      await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
      const res = await place(agent, rate.id, PDF_BYTES);
      expect(res.status).toBe(201);
      const payment = await prisma.payment.findFirstOrThrow({ where: { order: { reference: res.body.order.reference } } });
      expect(payment.proofCheck).toMatchObject({ status: 'DISABLED' });
    } finally {
      env.PROOF_AUTO_CHECK = true;
    }
  });
});

describe('suivi de commande en 3 étapes', () => {
  it('passe « En route » (virement vérifié) puis « Livrée », avec un e-mail au client à chaque étape', async () => {
    const { agent, rate } = await cartWith(1);
    const details = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
    const placed = await agent.post('/api/checkout/orders').set(CSRF).field('data', orderData(rate.id)).attach('proof', proofOf(details), { filename: 'virement.pdf', contentType: 'application/pdf' });
    const order = await prisma.order.findUniqueOrThrow({ where: { reference: placed.body.order.reference } });
    const { email, password } = await createUser('ADMIN');
    const admin = await loginAgent(email, password);

    expect((await admin.patch(`/api/admin/orders/${order.id}/status`).set(CSRF).send({ status: 'DELIVERED' })).status).toBe(422);
    // « En route » sans numéro de suivi ni case cochée : l'e-mail d'étape part quand même.
    const shipped = await admin.patch(`/api/admin/orders/${order.id}/status`).set(CSRF).send({ status: 'SHIPPED', notifyCustomer: false });
    expect(shipped.status).toBe(200);
    const afterShip = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    expect(afterShip.status).toBe('SHIPPED');
    expect(afterShip.payments[0]!.status).toBe('VERIFIED');
    expect(afterShip.paidAt).not.toBeNull();

    expect((await admin.patch(`/api/admin/orders/${order.id}/status`).set(CSRF).send({ status: 'DELIVERED' })).status).toBe(200);
    const mails = await prisma.emailMessage.findMany({ where: { orderId: order.id, template: 'order-status' }, orderBy: { createdAt: 'asc' } });
    expect(mails.map((m) => (m.payload as { message: string }).message)).toEqual([
      'Votre commande est déjà en route vers votre adresse.',
      'Votre commande est arrivée à votre adresse. Merci pour l’achat.',
    ]);
    expect(mails.every((m) => m.toAddress === 'lea@glaciora.test' && (m.payload as { orderUrl: string }).orderUrl.includes(`t=${orderTrackingToken(order.id)}`))).toBe(true);
  });
});
