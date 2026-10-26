import { prisma } from '../src/lib/prisma';
import { processEmailQueue } from '../src/modules/email/email.service';

/** Traite la file d'e-mails une fois (utile en cron si le worker intégré est désactivé). */
processEmailQueue(100)
  .then((stats) => console.warn(`E-mails : ${stats.sent} envoyé(s), ${stats.logged} journalisé(s), ${stats.failed} en échec`))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
