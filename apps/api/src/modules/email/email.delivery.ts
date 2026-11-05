import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

/** Événements Brevo qui signifient que l'e-mail n'atteindra pas le destinataire. */
const REJECTION_EVENTS = new Set(['error', 'blocked', 'hardBounces', 'invalid']);
const CHECK_EVERY_MS = 10 * 60 * 1000;
const CHECK_WINDOW_MS = 72 * 3600 * 1000;

interface BrevoEvent {
  event: string;
  reason?: string;
}

/**
 * « SENT » signifie seulement que Brevo a accepté l'e-mail : la livraison (ou un refus après coup, par exemple
 * expéditeur non validé) se lit dans ses événements. Les e-mails envoyés depuis moins de 72 h sont vérifiés :
 * livré → deliveredAt ; refusé → FAILED avec le motif (visible dans Admin > Journaux, et « Renvoyer » possible).
 */
export async function syncEmailDeliveryStatus(
  options: { fetchImpl?: typeof fetch; now?: Date; apiKey?: string; enabled?: boolean } = {},
): Promise<{ delivered: number; rejected: number }> {
  const { fetchImpl = fetch, now = new Date(), apiKey = env.BREVO_API_KEY, enabled = env.EMAIL_PROVIDER === 'brevo' } = options;
  if (!enabled || !apiKey) return { delivered: 0, rejected: 0 };
  const messages = await prisma.emailMessage.findMany({
    where: {
      status: 'SENT',
      provider: 'brevo',
      providerMessageId: { not: null },
      deliveredAt: null,
      sentAt: { gte: new Date(now.getTime() - CHECK_WINDOW_MS) },
      OR: [{ deliveryCheckedAt: null }, { deliveryCheckedAt: { lt: new Date(now.getTime() - CHECK_EVERY_MS) } }],
    },
    take: 50,
    select: { id: true, providerMessageId: true },
  });
  let delivered = 0;
  let rejected = 0;
  for (const message of messages) {
    try {
      const url = `https://api.brevo.com/v3/smtp/statistics/events?days=7&limit=50&messageId=${encodeURIComponent(message.providerMessageId!)}`;
      const res = await fetchImpl(url, { headers: { 'api-key': apiKey, accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`Brevo HTTP ${res.status}`);
      const events = ((await res.json().catch(() => ({}))) as { events?: BrevoEvent[] }).events ?? [];
      const rejection = events.find((e) => REJECTION_EVENTS.has(e.event));
      if (rejection) {
        await prisma.emailMessage.update({
          where: { id: message.id },
          data: { status: 'FAILED', deliveryCheckedAt: now, lastError: `Refusé par Brevo après acceptation (${rejection.event}) : ${rejection.reason ?? 'sans motif'}`.slice(0, 500) },
        });
        rejected++;
      } else if (events.some((e) => e.event === 'delivered')) {
        await prisma.emailMessage.update({ where: { id: message.id }, data: { deliveredAt: now, deliveryCheckedAt: now } });
        delivered++;
      } else {
        await prisma.emailMessage.update({ where: { id: message.id }, data: { deliveryCheckedAt: now } });
      }
    } catch (err) {
      logger.warn({ emailId: message.id, err: (err as Error).message }, 'Suivi de livraison Brevo : vérification impossible');
    }
  }
  if (rejected) logger.warn({ rejected }, 'E-mails refusés par Brevo après acceptation');
  return { delivered, rejected };
}
