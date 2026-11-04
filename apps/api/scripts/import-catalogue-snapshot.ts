import { prisma } from '../src/lib/prisma';
import { logActivity } from '../src/lib/activity';
import { installCatalogueSnapshot } from '../src/modules/catalogue-import/snapshot.service';

/**
 * npm run catalogue:install -w @glaciora/api
 * Installe data/catalogue-snapshot.json (voir installCatalogueSnapshot). Même action que le bouton de l'admin
 * « Import catalogue » sur un serveur sans dossier GLACIORA_CATALOGUE.
 */
async function main() {
  const result = await installCatalogueSnapshot();
  await logActivity({ action: 'catalogue.snapshot_installed', entityType: 'ImportRun', entityId: result.runId, metadata: { exportedAt: result.exportedAt, ...result.summary } });
  console.warn(`Catalogue : ${result.summary.created} créé(s), ${result.summary.updated} mis à jour, ${result.summary.unchanged} inchangé(s), ${result.summary.errors} erreur(s).`);
  if (result.summary.errors > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
