import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseCsv } from 'csv-parse/sync';
import { z } from 'zod';
import type { Audience } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/**
 * Rayons Hommes / Femmes / Enfants : une ligne par article (référence, slug, public, preuve). Le public vient de la fiche
 * (« Public ») ou de la page du fabricant / du revendeur citée dans la colonne evidence ; jamais déduit au hasard.
 * UNISEX = article adulte sans version homme/femme (affiché dans les deux rayons).
 */
export const AUDIENCE_FILE = path.resolve(__dirname, '../../../data/catalogue-audience.csv');

const rowSchema = z.object({
  // GLA-001… et HL-001… (hockey du catalogue client).
  reference: z.string().regex(/^[A-Z]{2,4}-\d{3}$/),
  slug: z.string().min(1),
  audience: z.enum(['MEN', 'WOMEN', 'KIDS', 'UNISEX']),
  evidence: z.string().min(3),
});

/** Applique le classement à chaque import (y compris aux articles inchangés). Renvoie le nombre d'articles classés. */
export async function applyCatalogueAudience(file = AUDIENCE_FILE): Promise<number> {
  if (!existsSync(file)) return 0;
  const rows = (parseCsv(await readFile(file, 'utf8'), { bom: true, columns: true, delimiter: ';', skip_empty_lines: true, trim: true }) as unknown[]).map((r) => rowSchema.parse(r));
  const groups = new Map<Audience, string[]>();
  for (const row of rows) groups.set(row.audience, [...(groups.get(row.audience) ?? []), row.reference]);
  let count = 0;
  for (const [audience, references] of groups) {
    count += (await prisma.product.updateMany({ where: { reference: { in: references } }, data: { audience } })).count;
  }
  return count;
}
