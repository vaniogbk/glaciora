import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { syncEmailDeliveryStatus } from '../email/email.delivery';
import { purgeExpiredProofs } from '../storage/proof-retention';

const PURGE_EVERY_MS = 6 * 3600 * 1000;
const DELIVERY_EVERY_MS = 10 * 60 * 1000;

/**
 * Tâches de fond de l'API (pas de service cron séparé à configurer sur Railway) :
 * purge des preuves expirées (au démarrage puis toutes les 6 h) et suivi de livraison des e-mails (toutes les 10 min).
 * Retourne une fonction d'arrêt.
 */
export function startMaintenanceWorker(): () => void {
  if (env.NODE_ENV === 'test') return () => undefined;
  const run = (name: string, task: () => Promise<unknown>) => () => {
    task().catch((err) => logger.error({ task: name, err: (err as Error).message }, 'Tâche de maintenance : erreur'));
  };
  const purge = run('purge-justificatifs', () => purgeExpiredProofs());
  const delivery = run('livraison-e-mails', () => syncEmailDeliveryStatus());
  const first = setTimeout(() => {
    purge();
    delivery();
  }, 60_000);
  const purgeTimer = setInterval(purge, PURGE_EVERY_MS);
  const deliveryTimer = setInterval(delivery, DELIVERY_EVERY_MS);
  for (const t of [first, purgeTimer, deliveryTimer]) t.unref();
  return () => {
    clearTimeout(first);
    clearInterval(purgeTimer);
    clearInterval(deliveryTimer);
  };
}
