import { formatIban } from '@glaciora/shared';
import { bankDetailsConfigured, env } from '../../config/env';
import { prisma } from '../../lib/prisma';

export type PaymentMethodId = 'BANK_TRANSFER' | 'CARD';

export interface PaymentMethodDescriptor {
  id: PaymentMethodId;
  label: string;
  available: boolean;
  unavailableReason?: string;
}

/**
 * Point d'extension pour un futur prestataire carte (Stripe, Mollie, Adyen…).
 * Aucune implémentation n'est branchée : le paiement carte est indisponible et ne doit jamais être simulé.
 * Une intégration devra implémenter cette interface puis la déclarer dans `cardProvider`.
 */
export interface CardPaymentProvider {
  readonly name: string;
  createPayment(input: { orderId: string; amountCents: number; currency: string; returnUrl: string }): Promise<{ redirectUrl: string; providerPaymentId: string }>;
  verifyWebhook(rawBody: Buffer, signature: string): Promise<{ providerPaymentId: string; status: 'succeeded' | 'failed' }>;
}

export const cardProvider: CardPaymentProvider | null = null;

export async function listPaymentMethods(): Promise<PaymentMethodDescriptor[]> {
  const bankAvailable = bankDetailsConfigured || (await prisma.bankAccount.count({ where: { isActive: true } })) > 0;
  return [
    {
      id: 'BANK_TRANSFER',
      label: 'Virement bancaire',
      available: bankAvailable,
      unavailableReason: bankAvailable ? undefined : 'Coordonnées bancaires non configurées',
    },
    {
      id: 'CARD',
      label: 'Carte bancaire',
      available: cardProvider !== null,
      unavailableReason: cardProvider ? undefined : 'Indisponible pour le moment',
    },
  ];
}

export interface ReceivingAccount {
  bankAccountId: string | null;
  label: string;
  accountHolder: string;
  iban: string;
  bic: string | null;
  bankName: string | null;
}

export function maskIban(iban: string): string {
  const clean = iban.replace(/\s+/g, '');
  return `${clean.slice(0, 4)} •••• ${clean.slice(-4)}`;
}

/** Clé du compte affiché au client, signée avec la référence de virement : identifiant BankAccount ou compte par défaut. */
export const ENV_ACCOUNT_KEY = 'env';
export const accountKeyOf = (account: ReceivingAccount): string => account.bankAccountId ?? ENV_ACCOUNT_KEY;

type BankAccountRow = { id: string; label: string; accountHolder: string; iban: string; bic: string | null; bankName: string | null };
const fromRow = (a: BankAccountRow): ReceivingAccount => ({ bankAccountId: a.id, label: a.label, accountHolder: a.accountHolder, iban: formatIban(a.iban), bic: a.bic, bankName: a.bankName });

function envAccount(): ReceivingAccount | null {
  if (!bankDetailsConfigured) return null;
  return {
    bankAccountId: null,
    label: 'Compte principal',
    accountHolder: env.BANK_ACCOUNT_HOLDER!,
    iban: formatIban(env.BANK_IBAN!),
    bic: env.BANK_BIC ?? null,
    bankName: env.BANK_NAME ?? null,
  };
}

/** Répartition entre plusieurs comptes d'un même pays : celui qui a reçu une commande le moins récemment (jamais utilisé d'abord). */
async function leastRecentlyAssigned(accounts: BankAccountRow[]): Promise<BankAccountRow> {
  const last = await prisma.payment.groupBy({ by: ['bankAccountId'], where: { bankAccountId: { in: accounts.map((a) => a.id) } }, _max: { createdAt: true } });
  const lastAt = new Map(last.map((r) => [r.bankAccountId, r._max.createdAt?.getTime() ?? 0]));
  return accounts.reduce((best, a) => ((lastAt.get(a.id) ?? 0) < (lastAt.get(best.id) ?? 0) ? a : best));
}

/**
 * Compte de réception pour un pays de livraison : un compte admin actif rattaché au pays (réparti s'il y en a plusieurs),
 * sinon compte par défaut des variables d'environnement, sinon aucun (virement indisponible).
 * `preferredKey` : compte déjà affiché pour la même référence, conservé tant qu'il couvre encore le pays.
 */
export async function resolveReceivingAccount(countryCode: string, preferredKey?: string): Promise<ReceivingAccount | null> {
  const accounts = await prisma.bankAccount.findMany({
    where: { isActive: true, countryCodes: { has: countryCode.toUpperCase() } },
    orderBy: { createdAt: 'asc' },
  });
  if (accounts.length === 0) return envAccount();
  const preferred = accounts.find((a) => a.id === preferredKey);
  if (preferred) return fromRow(preferred);
  return fromRow(accounts.length === 1 ? accounts[0]! : await leastRecentlyAssigned(accounts));
}

/** Compte affiché au client lors de la préparation du virement, même désactivé depuis : c'est celui qu'il a payé. */
export async function findShownAccount(key: string): Promise<ReceivingAccount | null> {
  if (key === ENV_ACCOUNT_KEY) return envAccount();
  const account = await prisma.bankAccount.findUnique({ where: { id: key } });
  return account ? fromRow(account) : null;
}
