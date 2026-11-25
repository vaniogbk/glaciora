import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import type { CardPayment, CardPaymentProvider, CardPaymentStatus, CreateCardPaymentInput } from './card-provider';

const API = 'https://api.mollie.com/v2';
const TIMEOUT_MS = 15_000;
const STATUSES: readonly CardPaymentStatus[] = ['open', 'pending', 'authorized', 'paid', 'failed', 'canceled', 'expired'];
const PAYMENT_ID = /^tr_[A-Za-z0-9]{4,40}$/;
/** Activation des moyens de paiement relue chez Mollie au plus toutes les 10 min (affichage de la carte sur le site). */
const READY_TTL_MS = 10 * 60_000;

/** Langues de la page de paiement Mollie ; les autres langues du site laissent Mollie choisir d'après le navigateur. */
const LOCALES: Record<string, string> = {
  fr: 'fr_FR', en: 'en_US', de: 'de_DE', es: 'es_ES', it: 'it_IT', nl: 'nl_NL', pt: 'pt_PT', pl: 'pl_PL',
  fi: 'fi_FI', sv: 'sv_SE', nb: 'nb_NO', da: 'da_DK', is: 'is_IS', lt: 'lt_LT', cs: 'cs_CZ', sk: 'sk_SK', sl: 'sl_SI',
};

const unavailable = () => new AppError(503, 'CARD_UNAVAILABLE', 'Le paiement par carte est momentanément indisponible');

/** Montant Mollie (« 12.34 ») depuis des centimes, sans passer par un nombre à virgule. */
export function toMollieAmount(cents: number): string {
  return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

export function fromMollieAmount(value: unknown): number {
  const match = typeof value === 'string' ? /^(\d+)\.(\d{2})$/.exec(value) : null;
  if (!match) throw new Error('Montant Mollie illisible');
  return Number(match[1]) * 100 + Number(match[2]);
}

interface MolliePaymentBody {
  id?: unknown;
  status?: unknown;
  mode?: unknown;
  amount?: { value?: unknown; currency?: unknown };
  metadata?: unknown;
  _links?: { checkout?: { href?: unknown } };
}

function toPayment(body: MolliePaymentBody): CardPayment {
  const status = body.status as CardPaymentStatus;
  if (typeof body.id !== 'string' || !STATUSES.includes(status) || typeof body.amount?.currency !== 'string') throw new Error('Réponse Mollie inattendue');
  return {
    providerPaymentId: body.id,
    status,
    amountCents: fromMollieAmount(body.amount.value),
    currency: body.amount.currency,
    testMode: body.mode !== 'live',
    metadata: body.metadata && typeof body.metadata === 'object' ? (body.metadata as Record<string, unknown>) : null,
  };
}

/** Prestataire Mollie (API Payments v2, page de paiement hébergée par Mollie : la carte n'est jamais saisie chez nous). */
export function createMollieProvider(apiKey: string, methods: string[]): CardPaymentProvider {
  async function call(path: string, init: { method: 'GET' | 'POST'; body?: unknown }): Promise<MolliePaymentBody> {
    let res: Response;
    try {
      res = await fetch(`${API}${path}`, {
        method: init.method,
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/hal+json' },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      logger.error({ err: (err as Error).message }, 'Mollie injoignable');
      throw unavailable();
    }
    const body = (await res.json().catch(() => null)) as (MolliePaymentBody & { title?: string; detail?: string; field?: string }) | null;
    if (!res.ok || !body) {
      // Message d'erreur de Mollie (jamais la clé) : moyen de paiement non activé, profil non vérifié…
      logger.error({ status: res.status, title: body?.title, detail: body?.detail, field: body?.field }, 'Mollie : requête refusée');
      throw unavailable();
    }
    return body;
  }

  let ready: { at: number; ok: boolean } | null = null;

  return {
    name: 'mollie',
    testMode: apiKey.startsWith('test_'),
    async isReady() {
      if (ready && Date.now() - ready.at < READY_TTL_MS) return ready.ok;
      let ok = false;
      try {
        const body = (await call('/methods', { method: 'GET' })) as { _embedded?: { methods?: { id?: unknown }[] } };
        const active = new Set((body._embedded?.methods ?? []).map((m) => m.id));
        ok = methods.length === 0 ? active.size > 0 : methods.some((m) => active.has(m));
        if (!ok) logger.warn({ wanted: methods, active: [...active] }, 'Mollie : moyen de paiement non activé sur le compte, carte masquée');
      } catch {
        ok = false;
      }
      ready = { at: Date.now(), ok };
      return ok;
    },
    async createPayment(input: CreateCardPaymentInput) {
      const locale = input.locale ? LOCALES[input.locale] : undefined;
      const body = await call('/payments', {
        method: 'POST',
        body: {
          amount: { currency: input.currency, value: toMollieAmount(input.amountCents) },
          description: input.description.slice(0, 255),
          redirectUrl: input.redirectUrl,
          ...(input.webhookUrl ? { webhookUrl: input.webhookUrl } : {}),
          ...(locale ? { locale } : {}),
          ...(methods.length > 0 ? { method: methods } : {}),
          metadata: input.metadata,
        },
      });
      const checkoutUrl = body._links?.checkout?.href;
      if (typeof checkoutUrl !== 'string' || !checkoutUrl.startsWith('https://')) throw new Error('Mollie : lien de paiement absent');
      return { ...toPayment(body), checkoutUrl };
    },
    async getPayment(providerPaymentId: string) {
      if (!PAYMENT_ID.test(providerPaymentId)) throw new Error('Identifiant de paiement Mollie invalide');
      return toPayment(await call(`/payments/${providerPaymentId}`, { method: 'GET' }));
    },
  };
}
