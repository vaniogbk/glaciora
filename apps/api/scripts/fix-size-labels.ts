import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import { prisma } from '../src/lib/prisma';
import { logActivity } from '../src/lib/activity';
import { slugify } from '../src/lib/slug';
import { splitSizes } from '../src/modules/catalogue-import/import.service';

/**
 * npm run sizes:fix -w @glaciora/api            → simulation (rien n'est modifié)
 * npm run sizes:fix -w @glaciora/api -- --apply → correction
 *
 * Répare les tailles découpées à tort sur une virgule décimale par les anciens imports
 * (« S (52-55,5 cm) » enregistrée en « S (52-55 » + « 5 cm) »). La taille est corrigée sur place
 * (même variante : stock, paniers et commandes conservés) ; les fragments restants sont désactivés.
 */
async function main() {
  const apply = process.argv.includes('--apply');
  const csv = await readFile(path.join(__dirname, '..', 'data', 'catalogue-complement.csv'), 'utf8');
  const rows = parseCsv(csv, { bom: true, delimiter: ';', columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  let fixed = 0;
  let disabled = 0;

  for (const row of rows) {
    const reference = row.reference;
    const system = row.size_system;
    if (!reference || !row.sizes || !system) continue;
    const correct = splitSizes(row.sizes);
    const naive = row.sizes.split(',').map((s) => s.trim()).filter(Boolean);
    if (correct.length === naive.length) continue;

    const product = await prisma.product.findUnique({ where: { reference }, select: { id: true, name: true } });
    if (!product) continue;
    const skuOf = (label: string) => `${reference}-${slugify(label) || 'unique'}`.toUpperCase();
    const firstFragments = new Set<string>();

    for (const label of correct) {
      const first = label.split(',')[0]!.trim();
      firstFragments.add(skuOf(first));
      const variant = await prisma.productVariant.findUnique({ where: { sku: skuOf(first) }, select: { id: true } });
      const target = await prisma.productVariant.findUnique({ where: { sku: skuOf(label) }, select: { id: true } });
      if (!variant || target) continue;
      console.warn(`${reference} ${product.name} : « ${first} » → « ${label} »`);
      if (apply) {
        const size = await prisma.size.upsert({ where: { system_label: { system, label } }, create: { system, label }, update: {} });
        await prisma.productVariant.update({ where: { id: variant.id }, data: { sku: skuOf(label), sizeId: size.id, isActive: true } });
      }
      fixed++;
    }

    const leftovers = naive.map(skuOf).filter((sku) => !firstFragments.has(sku));
    for (const sku of new Set(leftovers)) {
      const variant = await prisma.productVariant.findUnique({ where: { sku }, select: { id: true, isActive: true } });
      if (!variant?.isActive) continue;
      console.warn(`${reference} ${product.name} : fragment ${sku} désactivé`);
      if (apply) await prisma.productVariant.update({ where: { id: variant.id }, data: { isActive: false } });
      disabled++;
    }
  }

  if (apply && (fixed || disabled)) await logActivity({ action: 'catalogue.sizes_fixed', entityType: 'ProductVariant', metadata: { fixed, disabled } });
  console.warn(`${apply ? 'Corrigé' : 'Simulation'} : ${fixed} taille(s) renommée(s), ${disabled} fragment(s) désactivé(s).${apply ? '' : ' Relancer avec --apply pour appliquer.'}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
