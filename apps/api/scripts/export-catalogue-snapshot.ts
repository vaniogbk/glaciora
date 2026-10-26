import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';

/**
 * npm run catalogue:snapshot -w @glaciora/api
 * Exporte le catalogue importé (produits, tailles, prix, images) vers data/catalogue-snapshot.json,
 * pour l'installer sur un serveur qui n'a pas le dossier GLACIORA_CATALOGUE (production Railway).
 */
async function main() {
  const products = await prisma.product.findMany({
    orderBy: { reference: 'asc' },
    include: {
      category: { select: { slug: true } },
      variants: { orderBy: { position: 'asc' }, include: { size: true, stock: true } },
      images: { orderBy: { position: 'asc' } },
    },
  });
  const snapshot = {
    exportedAt: new Date().toISOString(),
    products: products.map((p) => ({
      reference: p.reference,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      model: p.model,
      shortDescription: p.shortDescription,
      description: p.description,
      categorySlug: p.category.slug,
      sport: p.sport,
      condition: p.condition,
      status: p.status,
      currency: p.currency,
      priceFromCents: p.priceFromCents,
      compareAtPriceCents: p.compareAtPriceCents,
      weightGrams: p.weightGrams,
      dimensions: p.dimensions,
      specs: p.specs,
      colors: p.colors,
      isFeatured: p.isFeatured,
      isNew: p.isNew,
      sourceUrl: p.sourceUrl,
      priceSourceUrl: p.priceSourceUrl,
      priceCheckedAt: p.priceCheckedAt?.toISOString() ?? null,
      imagesAreIllustrations: p.imagesAreIllustrations,
      importChecksum: p.importChecksum,
      variants: p.variants.map((v) => ({
        sku: v.sku,
        sizeSystem: v.size?.system ?? null,
        sizeLabel: v.size?.label ?? null,
        sizeSortOrder: v.size?.sortOrder ?? 0,
        color: v.color,
        priceCents: v.priceCents,
        compareAtPriceCents: v.compareAtPriceCents,
        isActive: v.isActive,
        position: v.position,
        stock: v.stock?.quantity ?? 0,
      })),
      images: p.images.map((i) => ({ url: i.url, alt: i.alt, position: i.position, width: i.width, height: i.height, isIllustration: i.isIllustration, sourceFile: i.sourceFile })),
    })),
  };
  const file = path.resolve('data', 'catalogue-snapshot.json');
  await writeFile(file, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.warn(`${snapshot.products.length} produits exportés vers ${file}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
