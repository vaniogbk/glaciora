import { prisma } from '../src/lib/prisma';
import { purgeExpiredProofs } from '../src/modules/storage/proof-retention';

/** Purge manuelle (l'API la lance aussi toute seule toutes les 6 h) : justificatifs dont la date deleteAfter est dépassée. */
purgeExpiredProofs()
  .then(({ removed, failed }) => {
    console.warn(`${removed} justificatif(s) supprimé(s) selon la politique de conservation${failed ? `, ${failed} en échec` : ''}.`);
    if (failed) process.exitCode = 1;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
