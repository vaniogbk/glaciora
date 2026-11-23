import request from 'supertest';
import { app, CSRF, proofOf, resetDb } from './helpers';
import { prisma } from '../src/lib/prisma';
import { shutdownProofReader } from '../src/modules/checkout/proof-check';

afterAll(async () => {
  await shutdownProofReader();
  await prisma.$disconnect();
});
beforeEach(resetDb);

const address = { firstName: 'Léa', lastName: 'Martin', line1: '1 rue des Alpes', postalCode: '74400', city: 'Chamonix', countryCode: 'FR', phone: '+33 6 00 00 00 00' };

/** Les 4 articles du « Pack équipement ski » (GLA-055, GLA-018, GLA-019, GLA-021) : 100 € + 200 € + 300 € + 400 €. */
async function seedSkiGearPack() {
  const category = await prisma.category.create({ data: { slug: 'skis', name: 'Skis', sport: 'SKI' } });
  const variants: string[] = [];
  for (const [i, reference] of ['GLA-055', 'GLA-018', 'GLA-019', 'GLA-021'].entries()) {
    const product = await prisma.product.create({
      data: {
        reference,
        slug: `test-pack-${i}`,
        name: `[TEST] Article ${i + 1}`,
        brand: 'TestBrand',
        categoryId: category.id,
        sport: 'SKI',
        status: 'ACTIVE',
        variants: { create: { sku: `${reference}-U`, priceCents: (i + 1) * 10_000, stock: { create: { quantity: 5 } } } },
      },
      include: { variants: true },
    });
    variants.push(product.variants[0]!.id);
  }
  const zone = await prisma.shippingZone.create({
    data: { name: 'France', countries: { create: { code: 'FR', name: 'France', isEnabled: true } }, rates: { create: { name: 'Standard [TEST]', priceCents: 990, freeAboveCents: 100_000 } } },
    include: { rates: true },
  });
  return { variants, rate: zone.rates[0]! };
}

describe('packs', () => {
  it('ne propose que les packs dont tous les articles sont en vente', async () => {
    await seedSkiGearPack();
    const res = await request(app).get('/api/catalogue/packs');
    expect(res.status).toBe(200);
    expect(res.body.packs.map((p: { slug: string }) => p.slug)).toEqual(['pack-equipement-ski']);
    expect(res.body.packs[0]).toMatchObject({ itemsTotalCents: 100_000, discountCents: 10_000, packPriceCents: 90_000 });
    expect((await request(app).get('/api/catalogue/packs/pack-hockey-complet-senior')).status).toBe(404);
  });

  it('remise le pack complet dans le panier, le montant à virer et la commande', async () => {
    const { variants, rate } = await seedSkiGearPack();
    const agent = request.agent(app);
    for (const variantId of variants) expect((await agent.post('/api/cart/items').set(CSRF).send({ variantId, quantity: 1 })).status).toBe(201);

    const cart = (await agent.get('/api/cart')).body.cart;
    expect(cart).toMatchObject({ subtotalCents: 100_000, discountCents: 10_000, totalCents: 90_000 });
    expect(cart.packs).toEqual([{ slug: 'pack-equipement-ski', name: 'Pack équipement ski', count: 1, discountCents: 10_000 }]);

    // Livraison calculée sur le montant remisé (90 € < seuil de gratuité de 1 000 €) : 9,90 €.
    const details = await agent.post('/api/checkout/payment-details').set(CSRF).send({ countryCode: 'FR', shippingRateId: rate.id });
    expect(details.status).toBe(200);
    expect(details.body).toMatchObject({ amountCents: 90_990, subtotalCents: 100_000, discountCents: 10_000, shippingCents: 990 });

    const order = await agent
      .post('/api/checkout/orders')
      .set(CSRF)
      .field('data', JSON.stringify({ email: 'lea@glaciora.test', shippingAddress: address, shippingRateId: rate.id, paymentMethod: 'BANK_TRANSFER', acceptTerms: true }))
      .attach('proof', proofOf(details), { filename: 'virement.pdf', contentType: 'application/pdf' });
    expect(order.status).toBe(201);
    expect(order.body.order.totalCents).toBe(90_990);
    const saved = await prisma.order.findUniqueOrThrow({ where: { reference: order.body.order.reference }, include: { payments: true } });
    expect(saved).toMatchObject({ subtotalCents: 100_000, discountCents: 10_000, discountLabel: 'Pack équipement ski', shippingCents: 990, totalCents: 90_990 });
    expect(saved.payments[0]!.amountCents).toBe(90_990);
  });

  it('retire la remise dès que le pack n’est plus complet', async () => {
    const { variants } = await seedSkiGearPack();
    const agent = request.agent(app);
    for (const variantId of variants) await agent.post('/api/cart/items').set(CSRF).send({ variantId, quantity: 1 });
    const after = (await agent.delete(`/api/cart/items/${variants[0]}`).set(CSRF)).body.cart;
    expect(after).toMatchObject({ subtotalCents: 90_000, discountCents: 0, totalCents: 90_000, packs: [] });
  });
});
