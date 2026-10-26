import { prisma } from '../src/lib/prisma';
import { logActivity } from '../src/lib/activity';

/**
 * npm run stock:min -w @glaciora/api -- 30
 * Garantit au moins N unités en stock pour chaque taille de chaque article (le stock existant supérieur est conservé).
 */
async function main() {
  const min = Number(process.argv[2] ?? '30');
  if (!Number.isInteger(min) || min < 0 || min > 10_000) throw new Error('Usage : set-min-stock <quantité>');
  const variants = await prisma.productVariant.findMany({ select: { id: true, stock: { select: { quantity: true } } } });
  let raised = 0;
  for (const v of variants) {
    const current = v.stock?.quantity ?? 0;
    if (current >= min) continue;
    await prisma.$transaction([
      prisma.stock.upsert({ where: { variantId: v.id }, create: { variantId: v.id, quantity: min }, update: { quantity: min } }),
      prisma.stockMovement.create({ data: { variantId: v.id, type: 'ADJUSTMENT', delta: min - current, reason: `Stock minimum ${min} (demande GLACIORA)` } }),
    ]);
    raised++;
  }
  await logActivity({ action: 'stock.minimum_applied', entityType: 'ProductVariant', metadata: { min, raised, total: variants.length } });
  console.warn(`${raised} taille(s) portée(s) à ${min} unités sur ${variants.length}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
