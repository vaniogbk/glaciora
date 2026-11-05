import { ApiError } from '@/lib/api-client';
import type { Locale } from './config';
import type { Messages } from './messages/fr';

/**
 * Message d'erreur d'un appel API dans la langue du visiteur. En français, le message précis de l'API est conservé ;
 * ailleurs, il est remplacé par la traduction de son code (code détaillé d'abord, ex. AMOUNT_CHANGED), sinon un message générique.
 */
export function apiErrorMessage(err: unknown, locale: Locale, m: Pick<Messages, 'errors'>, fallback?: string): string {
  if (!(err instanceof ApiError)) return fallback ?? m.errors.generic;
  if (err.body.code === 'NETWORK') return m.errors.network;
  if (err.body.code === 'TIMEOUT') return m.errors.timeout;
  if (locale === 'fr' && err.body.message) return err.body.message;
  const detailCode = (err.body.details as { code?: string } | undefined)?.code;
  const codes = m.errors.codes;
  const code = [detailCode, err.body.code].find((c): c is string => Boolean(c && codes[c]));
  if (code) return codes[code]!;
  if (err.body.code?.startsWith('PROOF_')) return codes.PROOF_INVALID ?? m.errors.generic;
  return fallback ?? m.errors.generic;
}

/** Messages de validation (schémas partagés rédigés en français) traduits ; message inconnu : gardé tel quel. */
export function translateFieldErrors(errors: Record<string, string>, m: Pick<Messages, 'validation'>): Record<string, string> {
  return Object.fromEntries(Object.entries(errors).map(([key, message]) => [key, m.validation[message] ?? message]));
}
