import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { startEmailWorker } from './modules/email/email.worker';
import { startMaintenanceWorker } from './modules/maintenance/maintenance.worker';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'API GLACIORA démarrée');
});

const stopWorker = startEmailWorker();
const stopMaintenance = startMaintenanceWorker();

function shutdown(signal: string) {
  logger.info({ signal }, 'Arrêt en cours');
  stopWorker();
  stopMaintenance();
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
