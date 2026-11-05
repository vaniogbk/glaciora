import { createHmac } from 'node:crypto';
import { localizedPath } from '@glaciora/shared';
import { env } from '../../config/env';
import { safeEqual } from '../../lib/tokens';

/**
 * Lien de suivi envoyé par e-mail à chaque étape : signé (HMAC) avec l'identifiant interne de la commande,
 * il ouvre la page de suivi sans connexion (commandes invitées comprises) et ne peut pas être deviné à partir de la référence.
 */
export function orderTrackingToken(orderId: string): string {
  return createHmac('sha256', env.JWT_ACCESS_SECRET).update(`order-tracking:${orderId}`).digest('base64url');
}

export function isValidTrackingToken(orderId: string, token: unknown): boolean {
  return typeof token === 'string' && token.length > 0 && token.length <= 100 && safeEqual(token, orderTrackingToken(orderId));
}

/** Lien vers la page de suivi dans la langue de la commande (français sans préfixe). */
export function orderTrackingUrl(order: { id: string; reference: string; locale?: string | null }): string {
  return `${env.PUBLIC_SITE_URL}${localizedPath(order.locale, '/commande/suivi')}?ref=${encodeURIComponent(order.reference)}&t=${orderTrackingToken(order.id)}`;
}
