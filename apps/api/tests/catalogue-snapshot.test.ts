import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';
import { installCatalogueSnapshot } from '../src/modules/catalogue-import/snapshot.service';
import { resetDb } from './helpers';

afterAll(() => prisma.$disconnect());
beforeEach(resetDb);

const product = {
  reference: 'TST-001',
  slug: 'test-casque',
  name: 'Casque test',
  brand: 'Marque test',
  model: null,
  shortDescription: null,
  description: null,
  categorySlug: 'casques-hockey',
  sport: 'HOCKEY',
  condition: 'NEW',
  status: 'ACTIVE',
  currency: 'EUR',
  priceFromCents: 9990,
  compareAtPriceCents: null,
  weightGrams: null,
  dimensions: null,
  specs: null,
  colors: [],
  isFeatured: false,
  isNew: false,
  sourceUrl: null,
  priceSourceUrl: null,
  priceCheckedAt: null,
  imagesAreIllustrations: true,
  importChecksum: 'abc',
  variants: [{ sku: 'TST-001-M', sizeSystem: 'HELMET', sizeLabel: 'M', sizeSortOrder: 2, color: null, priceCents: 9990, compareAtPriceCents: null, isActive: true, position: 0, stock: 4 }],
  images: [{ url: '/media/products/tst-001.webp', alt: 'Casque test', position: 0, width: null, height: null, isIllustration: true, sourceFile: null }],
};

describe('instantané du catalogue (production sans dossier GLACIORA_CATALOGUE)', () => {
  it('installe, trace l’import et ne réécrit pas un produit inchangé ni le stock', async () => {
    const file = path.join(await mkdtemp(path.join(os.tmpdir(), 'glaciora-')), 'catalogue-snapshot.json');
    await writeFile(file, JSON.stringify({ exportedAt: '2026-11-05T00:00:00.000Z', products: [product] }));

    const first = await installCatalogueSnapshot({ file });
    expect(first.summary).toEqual({ created: 1, updated: 0, unchanged: 0, errors: 0 });
    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { sku: 'TST-001-M' }, include: { stock: true } });
    expect(variant.stock?.quantity).toBe(4);

    await prisma.stock.update({ where: { variantId: variant.id }, data: { quantity: 30 } });
    await prisma.product.update({ where: { reference: 'TST-001' }, data: { name: 'Nom modifié dans l’admin' } });
    const second = await installCatalogueSnapshot({ file });
    expect(second.summary).toEqual({ created: 0, updated: 0, unchanged: 1, errors: 0 });
    expect((await prisma.product.findUniqueOrThrow({ where: { reference: 'TST-001' } })).name).toBe('Nom modifié dans l’admin');
    expect((await prisma.stock.findUniqueOrThrow({ where: { variantId: variant.id } })).quantity).toBe(30);

    const runs = await prisma.importRun.findMany({ orderBy: { startedAt: 'asc' } });
    expect(runs.map((r) => [r.createdCount, r.skippedCount])).toEqual([[1, 0], [0, 1]]);
  });
});
