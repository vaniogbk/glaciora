import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Prisma } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { logActivity } from '../src/lib/activity';
import { ensureCategories } from '../src/modules/catalogue-import/import.service';

/**
 * npm run catalogue:install -w @glaciora/api
 * Installe data/catalogue-snapshot.json (idempotent) : produits créés ou mis à jour par référence,
 * tailles par SKU, images par URL. Un produit dont l'empreinte d'import n'a pas changé n'est pas réécrit
 * (les modifications faites dans l'admin sont conservées). Le stock n'est fixé qu'à la création.
 */
interface SnapshotVariant {
  sku: string;
  sizeSystem: string | null;
  sizeLabel: string | null;
  sizeSortOrder: number;
  color: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  isActive: boolean;
  position: number;
  stock: number;
}
interface SnapshotProduct {
  reference: string;
  slug: string;
  name: string;
  brand: string;
  model: string | null;
  shortDescription: string | null;
  description: string | null;
  categorySlug: string;
  sport: 'SKI' | 'HOCKEY';
  condition: 'NEW' | 'USED';
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  currency: string;
  priceFromCents: number | null;
  compareAtPriceCents: number | null;
  weightGrams: number | null;
  dimensions: string | null;
  specs: Prisma.InputJsonValue | null;
  colors: string[];
  isFeatured: boolean;
  isNew: boolean;
  sourceUrl: string | null;
  priceSourceUrl: string | null;
  priceCheckedAt: string | null;
  imagesAreIllustrations: boolean;
  importChecksum: string | null;
  variants: SnapshotVariant[];
  images: { url: string; alt: string; position: number; width: number | null; height: number | null; isIllustration: boolean; sourceFile: string | null }[];
}

async function main() {
  const snapshot = JSON.parse(await readFile(path.resolve('data', 'catalogue-snapshot.json'), 'utf8')) as { exportedAt: string; products: SnapshotProduct[] };
  await ensureCategories();
  const categories = new Map((await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]));
  const stats = { created: 0, updated: 0, unchanged: 0 };

  for (const p of snapshot.products) {
    const categoryId = categories.get(p.categorySlug);
    if (!categoryId) throw new Error(`Catégorie absente : ${p.categorySlug} (${p.reference})`);
    const existing = await prisma.product.findUnique({ where: { reference: p.reference }, select: { id: true, importChecksum: true } });
    if (existing && p.importChecksum && existing.importChecksum === p.importChecksum) {
      stats.unchanged++;
      continue;
    }
    const data = {
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      model: p.model,
      shortDescription: p.shortDescription,
      description: p.description,
      categoryId,
      sport: p.sport,
      condition: p.condition,
      currency: p.currency,
      priceFromCents: p.priceFromCents,
      compareAtPriceCents: p.compareAtPriceCents,
      weightGrams: p.weightGrams,
      dimensions: p.dimensions,
      specs: p.specs ?? undefined,
      colors: p.colors,
      isFeatured: p.isFeatured,
      isNew: p.isNew,
      sourceUrl: p.sourceUrl,
      priceSourceUrl: p.priceSourceUrl,
      priceCheckedAt: p.priceCheckedAt ? new Date(p.priceCheckedAt) : null,
      imagesAreIllustrations: p.imagesAreIllustrations,
      importChecksum: p.importChecksum,
    };
    await prisma.$transaction(async (tx) => {
      const product = existing
        ? await tx.product.update({ where: { id: existing.id }, data })
        : await tx.product.create({ data: { ...data, reference: p.reference, status: p.status } });
      for (const image of p.images) {
        await tx.productImage.upsert({
          where: { productId_url: { productId: product.id, url: image.url } },
          create: { ...image, productId: product.id },
          update: { alt: image.alt, position: image.position, width: image.width, height: image.height, isIllustration: image.isIllustration },
        });
      }
      for (const v of p.variants) {
        const size =
          v.sizeSystem && v.sizeLabel
            ? await tx.size.upsert({
                where: { system_label: { system: v.sizeSystem, label: v.sizeLabel } },
                create: { system: v.sizeSystem, label: v.sizeLabel, sortOrder: v.sizeSortOrder },
                update: {},
              })
            : null;
        const variantData = { sizeId: size?.id ?? null, color: v.color, priceCents: v.priceCents, compareAtPriceCents: v.compareAtPriceCents, isActive: v.isActive, position: v.position };
        const variant = await tx.productVariant.upsert({
          where: { sku: v.sku },
          create: { ...variantData, sku: v.sku, productId: product.id, stock: { create: { quantity: v.stock } } },
          update: variantData,
        });
        if (!existing && v.stock > 0) {
          await tx.stockMovement.create({ data: { variantId: variant.id, type: 'IMPORT', delta: v.stock, reason: 'Installation du catalogue' } });
        }
      }
    });
    if (existing) stats.updated++;
    else stats.created++;
  }
  await logActivity({ action: 'catalogue.snapshot_installed', entityType: 'ImportRun', metadata: { exportedAt: snapshot.exportedAt, ...stats } });
  console.warn(`Catalogue : ${stats.created} créé(s), ${stats.updated} mis à jour, ${stats.unchanged} inchangé(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
