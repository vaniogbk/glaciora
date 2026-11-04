import { createHmac, randomBytes } from 'node:crypto';
import { generateOrderReference } from '@glaciora/shared';
import { env } from '../../config/env';
import { safeEqual } from '../../lib/tokens';

/**
 * Référence de virement réservée avant la création de la commande (le client doit pouvoir
 * faire son virement puis déposer la preuve). Signée HMAC et liée au montant : si le panier
 * change, la référence n'est plus valable et un nouveau QR code est affiché.
 */
export const REFERENCE_COOKIE = 'glaciora_ref';
export const REFERENCE_TTL_MS = 3 * 3600 * 1000;

function sign(data: string): string {
  return createHmac('sha256', env.JWT_ACCESS_SECRET).update(`checkout-ref:${data}`).digest('base64url');
}

export function newReference(now = new Date()): string {
  return generateOrderReference(now, randomBytes(5));
}

export interface SignedReference {
  reference: string;
  amountCents: number;
  /** Compte bancaire affiché au client (absent sur les références émises avant son ajout). */
  accountKey?: string;
}

export function encodeReference(reference: string, amountCents: number, expiresAt: number, accountKey: string): string {
  const data = `${reference}.${amountCents}.${expiresAt}.${accountKey}`;
  return `${data}.${sign(data)}`;
}

export function decodeReference(value: string | undefined, now = Date.now()): SignedReference | null {
  if (!value || value.length > 200) return null;
  const parts = value.split('.');
  if (parts.length !== 4 && parts.length !== 5) return null;
  const signature = parts.pop()!;
  if (!safeEqual(signature, sign(parts.join('.')))) return null;
  const [reference, amount, expires, accountKey] = parts as [string, string, string, string | undefined];
  if (!/^GLA-\d{6}-[A-Z0-9]{5}$/.test(reference)) return null;
  if (Number(expires) < now) return null;
  const amountCents = Number(amount);
  if (!Number.isInteger(amountCents) || amountCents <= 0) return null;
  if (accountKey !== undefined && !/^[a-z0-9]{1,40}$/.test(accountKey)) return null;
  return { reference, amountCents, accountKey };
}
