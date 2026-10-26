import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { importHomeImages, reportToMarkdown, runCatalogueImport } from '../src/modules/catalogue-import/import.service';

/**
 * npm run import:catalogue [-- --dry-run] [-- --no-images]
 * Lit GLACIORA_CATALOGUE (CATALOGUE_DIR) sans jamais le modifier, crée ou met à jour les produits,
 * écrit les images optimisées dans apps/web/public/media/products et un rapport dans import-reports/.
 */
async function main() {
  const args = new Set(process.argv.slice(2));
  const catalogueDir = path.resolve(env.CATALOGUE_DIR);
  const report = await runCatalogueImport({ catalogueDir, dryRun: args.has('--dry-run'), copyImages: !args.has('--no-images') });
  const markdown = reportToMarkdown(report);
  const outDir = path.resolve('import-reports');
  await mkdir(outDir, { recursive: true });
  const file = path.join(outDir, `import-${report.startedAt.toISOString().replace(/[:.]/g, '-')}.md`);
  await writeFile(file, markdown, 'utf8');
  console.warn(markdown);
  console.warn(`Rapport : ${file}`);
  if (!args.has('--dry-run') && !args.has('--no-images')) {
    const home = await importHomeImages(catalogueDir, path.resolve('../web'));
    if (!home.found) console.warn('05_ACCUEIL absent : visuels graphiques de repli conservés sur l’accueil.');
    else console.warn(`Visuels d’accueil : ${JSON.stringify(home.mapped)}${home.ignored.length ? ` · non reconnus : ${home.ignored.join(', ')}` : ''}`);
  }
  if (report.summary.errors > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
