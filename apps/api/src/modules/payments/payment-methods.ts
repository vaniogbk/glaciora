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

/**
 * Compte de réception pour un pays de livraison : compte admin dédié au pays s'il existe,
 * sinon compte par défaut des variables d'environnement, sinon aucun (virement indisponible).
 */
export async function resolveReceivingAccount(countryCode: string): Promise<ReceivingAccount | null> {
  const account = await prisma.bankAccount.findFirst({
    where: { isActive: true, countryCodes: { has: countryCode.toUpperCase() } },
    orderBy: { updatedAt: 'desc' },
  });
  if (account) {
    return { bankAccountId: account.id, label: account.label, accountHolder: account.accountHolder, iban: formatIban(account.iban), bic: account.bic, bankName: account.bankName };
  }
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
