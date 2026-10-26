import type { Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { getEmailProvider } from './email.providers';
import { renderTemplate, type TemplateName, type TemplatePayload } from './email.templates';

/** Délais avant nouvelle tentative (minutes) : 1, 5, 15, 60, 360. */
const BACKOFF_MINUTES = [1, 5, 15, 60, 360];

export function nextAttemptDelayMs(attempts: number): number {
  const minutes = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)] ?? 360;
  return minutes * 60 * 1000;
}

export async function queueEmail<T extends TemplateName>(
  input: { to: string; template: T; payload: TemplatePayload<T>; orderId?: string },
  tx: Prisma.TransactionClient = prisma,
) {
  const rendered = renderTemplate(input.template, input.payload);
  return tx.emailMessage.create({
    data: {
      toAddress: input.to,
      subject: rendered.subject,
      template: input.template,
      payload: input.payload as unknown as Prisma.InputJsonValue,
      orderId: input.orderId,
      maxAttempts: env.EMAIL_MAX_ATTEMPTS,
    },
  });
}

let running = false;

/** Traite les e-mails dus. Verrou optimiste par ligne (QUEUED → SENDING) pour éviter les doubles envois. */
export async function processEmailQueue(limit = 20): Promise<{ sent: number; failed: number; logged: number }> {
  if (running) return { sent: 0, failed: 0, logged: 0 };
  running = true;
  const stats = { sent: 0, failed: 0, logged: 0 };
  try {
    // Messages restés en SENDING (crash pendant l'envoi) : remis en file après 10 minutes.
    await prisma.emailMessage.updateMany({
      where: { status: 'SENDING', updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
      data: { status: 'QUEUED' },
    });
    const due = await prisma.emailMessage.findMany({
      where: { status: 'QUEUED', nextAttemptAt: { lte: new Date() } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    const provider = getEmailProvider();
    for (const message of due) {
      const claimed = await prisma.emailMessage.updateMany({ where: { id: message.id, status: 'QUEUED' }, data: { status: 'SENDING' } });
      if (claimed.count === 0) continue;
      const rendered = renderTemplate(message.template as TemplateName, message.payload as never);
      const attempts = message.attempts + 1;
      const result = await provider.send(message.toAddress, rendered);
      if (result.accepted) {
        await prisma.emailMessage.update({
          where: { id: message.id },
          data: { status: 'SENT', attempts, sentAt: new Date(), provider: provider.name, providerMessageId: result.providerMessageId, lastError: null },
        });
        stats.sent++;
      } else if (result.logged) {
        await prisma.emailMessage.update({ where: { id: message.id }, data: { status: 'LOGGED', attempts, provider: provider.name } });
        stats.logged++;
      } else {
        const exhausted = attempts >= message.maxAttempts;
        await prisma.emailMessage.update({
          where: { id: message.id },
          data: {
            status: exhausted ? 'FAILED' : 'QUEUED',
            attempts,
            provider: provider.name,
            lastError: (result.error ?? 'Erreur inconnue').slice(0, 500),
            nextAttemptAt: new Date(Date.now() + nextAttemptDelayMs(attempts)),
          },
        });
        stats.failed++;
        logger.warn({ emailId: message.id, attempts, exhausted }, "Échec d'envoi d'e-mail");
      }
    }
  } finally {
    running = false;
  }
  return stats;
}

/** Déclenche un traitement sans bloquer la réponse HTTP. */
export function kickEmailQueue(): void {
  if (env.NODE_ENV === 'test') return;
  setImmediate(() => {
    processEmailQueue().catch((err) => logger.error({ err: (err as Error).message }, 'File e-mail : erreur'));
  });
}
