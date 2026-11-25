import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import { createMollieProvider } from './mollie';

/** Statuts d'un paiement chez le prestataire (vocabulaire Mollie). */
export type CardPaymentStatus = 'open' | 'pending' | 'authorized' | 'paid' | 'failed' | 'canceled' | 'expired';
/** Statuts définitifs sans encaissement : la commande est annulée et le stock rendu. */
export const CARD_FAILURE_STATUSES: readonly CardPaymentStatus[] = ['failed', 'canceled', 'expired'];

export interface CreateCardPaymentInput {
  amountCents: number;
  currency: string;
  description: string;
  /** Page du site où le client revient après la page de paiement (payé, refusé ou abandonné). */
  redirectUrl: string;
  webhookUrl?: string;
  locale?: string | null;
  metadata: Record<string, string>;
}

export interface CardPayment {
  providerPaymentId: string;
  status: CardPaymentStatus;
  amountCents: number;
  currency: string;
  /** Paiement de test (clé test_) : ne vaut jamais encaissement réel. */
  testMode: boolean;
  metadata: Record<string, unknown> | null;
}

/**
 * Prestataire de paiement carte. Le résultat d'un paiement n'est jamais cru sur parole : il est toujours relu chez le
 * prestataire avec notre clé (webhook, retour du client ou tâche de fond), jamais simulé.
 */
export interface CardPaymentProvider {
  readonly name: string;
  readonly testMode: boolean;
  createPayment(input: CreateCardPaymentInput): Promise<CardPayment & { checkoutUrl: string }>;
  getPayment(providerPaymentId: string): Promise<CardPayment>;
  /** Moyens de paiement demandés réellement activés chez le prestataire (compte vérifié) ; résultat mis en cache. */
  isReady?(): Promise<boolean>;
}

/** Prestataire configuré ET prêt : sinon la carte est affichée indisponible plutôt que d'échouer au paiement. */
export async function getReadyCardProvider(): Promise<CardPaymentProvider | null> {
  const provider = getCardProvider();
  if (!provider) return null;
  return (await (provider.isReady?.() ?? Promise.resolve(true))) ? provider : null;
}

/** Chemin du webhook Mollie : exempté de l'en-tête CSRF (Mollie ne peut pas l'ajouter), le corps ne contient qu'un identifiant. */
export const MOLLIE_WEBHOOK_PATH = '/api/payments/mollie/webhook';

const MOLLIE_KEY = /^(test|live)_[A-Za-z0-9]{20,}$/;

let override: CardPaymentProvider | null | undefined;
let configured: CardPaymentProvider | null | undefined;

function fromEnv(): CardPaymentProvider | null {
  const key = env.MOLLIE_API_KEY;
  if (!key) return null;
  if (!MOLLIE_KEY.test(key)) {
    logger.error('MOLLIE_API_KEY ne ressemble pas à une clé Mollie (test_… ou live_…) : paiement carte désactivé');
    return null;
  }
  const testMode = key.startsWith('test_');
  if (testMode && env.APP_ENV === 'production') {
    logger.warn('Clé Mollie de test sur le serveur de production : paiement carte désactivé (mettre la clé live_)');
    return null;
  }
  // Clé réelle hors production (poste de développement, préproduction) : refusée, aucun vrai débit pendant les essais.
  if (!testMode && env.APP_ENV !== 'production') {
    logger.warn('Clé Mollie live_ hors production : paiement carte désactivé (mettre la clé test_ en local)');
    return null;
  }
  const methods = env.MOLLIE_METHODS.split(',').map((m) => m.trim()).filter(Boolean);
  return createMollieProvider(key, methods);
}

/** Prestataire carte configuré, ou null : la carte est alors affichée « indisponible » et refusée par l'API. */
export function getCardProvider(): CardPaymentProvider | null {
  if (override !== undefined) return override;
  if (configured === undefined) configured = fromEnv();
  return configured;
}

/** Tests uniquement : remplace le prestataire (undefined = revenir à la configuration). */
export function setCardProvider(provider: CardPaymentProvider | null | undefined): void {
  override = provider;
}

/** Adresse publique du webhook, ou rien en local (Mollie refuse une adresse qu'il ne peut pas joindre). */
export function cardWebhookUrl(): string | undefined {
  if (env.MOLLIE_WEBHOOK_URL) return env.MOLLIE_WEBHOOK_URL;
  const site = new URL(env.PUBLIC_SITE_URL);
  if (site.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(site.hostname)) return undefined;
  return `${site.origin}${MOLLIE_WEBHOOK_PATH}`;
}
