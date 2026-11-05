import request from 'supertest';
import { app, CSRF, createUser, loginAgent, resetDb, seedCatalogue } from './helpers';
import { prisma } from '../src/lib/prisma';

afterAll(() => prisma.$disconnect());
beforeEach(resetDb);

describe('coloris des produits', () => {
  it('déduit les coloris du produit de ses variantes et associe une photo à un coloris', async () => {
    const { product, variant } = await seedCatalogue(5);
    const { email, password } = await createUser('ADMIN');
    const admin = await loginAgent(email, password);

    expect((await admin.patch(`/api/admin/products/variants/${variant.id}`).set(CSRF).send({ color: 'Noir' })).status).toBe(200);
    const added = await admin.post(`/api/admin/products/${product.id}/variants`).set(CSRF).send({ sizeLabel: '170 cm', sizeSystem: 'SKI_LENGTH', color: 'Bleu', priceCents: 44990, stock: 3 });
    expect(added.status).toBe(201);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).colors).toEqual(['Noir', 'Bleu']);

    const image = await prisma.productImage.findFirstOrThrow({ where: { productId: product.id } });
    expect((await admin.patch(`/api/admin/products/images/${image.id}`).set(CSRF).send({ color: 'Bleu' })).status).toBe(200);
    const detail = await request(app).get(`/api/catalogue/products/${product.slug}`);
    expect(detail.body.product.images[0].color).toBe('Bleu');
    expect(detail.body.product.variants.map((v: { color: string }) => v.color).sort()).toEqual(['Bleu', 'Noir']);

    // Désactiver le dernier variant d'un coloris le retire de la liste des coloris.
    await admin.patch(`/api/admin/products/variants/${added.body.variant.id}`).set(CSRF).send({ isActive: false });
    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).colors).toEqual(['Noir']);
    // Coloris vidé sur la photo : commune à tous les coloris.
    await admin.patch(`/api/admin/products/images/${image.id}`).set(CSRF).send({ color: '' });
    expect((await prisma.productImage.findUniqueOrThrow({ where: { id: image.id } })).color).toBeNull();
  });
});
