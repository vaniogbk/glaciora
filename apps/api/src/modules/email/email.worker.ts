import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { processEmailQueue } from './email.service';

/** Relance périodique des e-mails en attente (retries). Retourne une fonction d'arrêt. */
export function startEmailWorker(): () => void {
  if (env.NODE_ENV === 'test' || env.EMAIL_WORKER_INTERVAL_MS === 0) return () => undefined;
  const timer = setInterval(() => {
    processEmailQueue().catch((err) => logger.error({ err: (err as Error).message }, 'Worker e-mail : erreur'));
  }, env.EMAIL_WORKER_INTERVAL_MS);
  timer.unref();
  return () => clearInterval(timer);
}
