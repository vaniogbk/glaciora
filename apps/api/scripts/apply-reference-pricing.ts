import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { prisma } from '../src/lib/prisma';
import { logActivity } from '../src/lib/activity';

/**
 * npx tsx scripts/apply-reference-pricing.ts data/amazon-pricing-2026-10-27.json
 * Prix de vente = prix de référence × (1 - remise), appliqué à toutes les tailles ; articles publiés.
 * Pas de prix barré (la remise se calcule sur un prix tiers, pas sur un ancien prix GLACIORA).
 */
const fileSchema = z.object({
  discount: z.number().min(0).max(0.9),
  items: z.array(
    z.object({
      reference: z.string(),
      name: z.string().min(2),
      referencePriceCents: z.number().int().positive(),
      match: z.enum(['exact', 'equivalent', 'market']),
      source: z.string().url(),
      note: z.string(),
    }),
  ),
});

async function main() {
  const file = process.argv[2] ?? 'data/amazon-pricing-2026-10-27.json';
  const config = fileSchema.parse(JSON.parse(await readFile(path.resolve(file), 'utf8')));
  for (const item of config.items) {
    const priceCents = Math.round(item.referencePriceCents * (1 - config.discount));
    const product = await prisma.product.findUnique({ where: { reference: item.reference }, include: { images: { select: { id: true } }, variants: { select: { id: true } } } });
    if (!product) {
      console.warn(`${item.reference} : absent de la base, ignoré`);
      continue;
    }
    if (product.images.length === 0 || product.variants.length === 0) {
      console.warn(`${item.reference} : sans image ou sans taille, non publié`);
      continue;
    }
    await prisma.$transaction([
      prisma.productVariant.updateMany({ where: { productId: product.id }, data: { priceCents, compareAtPriceCents: null, isActive: true } }),
      prisma.product.update({
        where: { id: product.id },
        data: { name: item.name, priceFromCents: priceCents, compareAtPriceCents: null, priceSourceUrl: item.source, priceCheckedAt: new Date('2026-10-27T00:00:00Z'), status: 'ACTIVE', archivedAt: null },
      }),
    ]);
    console.warn(`${item.reference.padEnd(8)} ${item.name.padEnd(32)} ${(item.referencePriceCents / 100).toFixed(2).padStart(8)} € → ${(priceCents / 100).toFixed(2).padStart(8)} €  [${item.match}]`);
  }
  await logActivity({ action: 'pricing.reference_applied', entityType: 'Product', metadata: { file, discount: config.discount, count: config.items.length } });
  console.warn(`Produits publiés : ${await prisma.product.count({ where: { status: 'ACTIVE' } })}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
