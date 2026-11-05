import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ensureCategories } from './import.service';

/**
 * Instantané du catalogue importé (data/catalogue-snapshot.json), versionné avec le code :
 * il permet d'installer le catalogue sur un serveur qui n'a pas le dossier GLACIORA_CATALOGUE (production).
 * Même chemin depuis src/ (tsx) et dist/ (build).
 */
export const SNAPSHOT_FILE = path.resolve(__dirname, '../../../data/catalogue-snapshot.json');

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
  images: { url: string; alt: string; position: number; width: number | null; height: number | null; isIllustration: boolean; sourceFile: string | null; color?: string | null }[];
}
interface Snapshot {
  exportedAt: string;
  products: SnapshotProduct[];
}

export async function snapshotInfo(file = SNAPSHOT_FILE): Promise<{ exportedAt: string; productCount: number } | null> {
  if (!existsSync(file)) return null;
  const snapshot = JSON.parse(await readFile(file, 'utf8')) as Snapshot;
  return { exportedAt: snapshot.exportedAt, productCount: snapshot.products.length };
}

/** Exporte les produits issus de l'import catalogue (les produits créés à la main dans l'admin restent hors instantané). */
export async function exportCatalogueSnapshot(file = SNAPSHOT_FILE): Promise<number> {
  const products = await prisma.product.findMany({
    where: { importChecksum: { not: null } },
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
      images: p.images.map((i) => ({ url: i.url, alt: i.alt, position: i.position, width: i.width, height: i.height, isIllustration: i.isIllustration, sourceFile: i.sourceFile, color: i.color })),
    })),
  };
  await writeFile(file, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  return snapshot.products.length;
}

/**
 * Installe l'instantané (idempotent) : produits créés ou mis à jour par référence, tailles par SKU, images par URL.
 * Un produit dont l'empreinte d'import n'a pas changé n'est pas réécrit (les modifications faites dans l'admin sont conservées).
 * Le stock n'est fixé qu'à la création. Chaque installation est tracée comme un import (historique de l'admin).
 */
export async function installCatalogueSnapshot(options: { triggeredById?: string; file?: string } = {}) {
  const file = options.file ?? SNAPSHOT_FILE;
  if (!existsSync(file)) throw new Error(`Instantané du catalogue absent : ${file}`);
  const snapshot = JSON.parse(await readFile(file, 'utf8')) as Snapshot;
  const run = await prisma.importRun.create({ data: { source: `${path.basename(file)} (${snapshot.exportedAt.slice(0, 10)})`, triggeredById: options.triggeredById ?? null } });
  await ensureCategories();
  const categories = new Map((await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]));
  const report: { reference: string; action: 'created' | 'updated' | 'unchanged' | 'error'; status?: string; message?: string }[] = [];

  for (const p of snapshot.products) {
    const categoryId = categories.get(p.categorySlug);
    if (!categoryId) {
      report.push({ reference: p.reference, action: 'error', message: `Catégorie absente : ${p.categorySlug}` });
      continue;
    }
    const existing = await prisma.product.findUnique({ where: { reference: p.reference }, select: { id: true, importChecksum: true, status: true } });
    if (existing && p.importChecksum && existing.importChecksum === p.importChecksum) {
      report.push({ reference: p.reference, action: 'unchanged', status: existing.status });
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
    try {
      const status = await prisma.$transaction(async (tx) => {
        const product = existing
          ? await tx.product.update({ where: { id: existing.id }, data })
          : await tx.product.create({ data: { ...data, reference: p.reference, status: p.status } });
        for (const image of p.images) {
          await tx.productImage.upsert({
            where: { productId_url: { productId: product.id, url: image.url } },
            create: { ...image, productId: product.id },
            update: { alt: image.alt, position: image.position, width: image.width, height: image.height, isIllustration: image.isIllustration, color: image.color ?? null },
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
        return product.status;
      });
      report.push({ reference: p.reference, action: existing ? 'updated' : 'created', status });
    } catch (err) {
      report.push({ reference: p.reference, action: 'error', message: (err as Error).message.slice(0, 200) });
    }
  }

  const summary = {
    created: report.filter((r) => r.action === 'created').length,
    updated: report.filter((r) => r.action === 'updated').length,
    unchanged: report.filter((r) => r.action === 'unchanged').length,
    errors: report.filter((r) => r.action === 'error').length,
  };
  await prisma.importRun.update({
    where: { id: run.id },
    data: { finishedAt: new Date(), createdCount: summary.created, updatedCount: summary.updated, skippedCount: summary.unchanged, errorCount: summary.errors, report },
  });
  return { runId: run.id, exportedAt: snapshot.exportedAt, summary };
}
