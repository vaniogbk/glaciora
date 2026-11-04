import { prisma } from '../src/lib/prisma';
import { SNAPSHOT_FILE, exportCatalogueSnapshot } from '../src/modules/catalogue-import/snapshot.service';

/**
 * npm run catalogue:snapshot -w @glaciora/api
 * Exporte le catalogue importé vers data/catalogue-snapshot.json (fait aussi automatiquement par « npm run import:catalogue »),
 * pour l'installer sur un serveur qui n'a pas le dossier GLACIORA_CATALOGUE (production Railway).
 */
async function main() {
  const count = await exportCatalogueSnapshot();
  console.warn(`${count} produits exportés vers ${SNAPSHOT_FILE}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
