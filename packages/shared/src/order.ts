export const ORDER_STATUSES = [
  'PENDING_PAYMENT_VERIFICATION',
  'PAID',
  'PREPARING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT_VERIFICATION: 'En attente de vérification du paiement',
  PAID: 'Payée',
  PREPARING: 'En préparation',
  SHIPPED: 'En route',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_VERIFICATION: 'Virement à vérifier',
  VERIFIED: 'Paiement vérifié',
  REJECTED: 'Paiement refusé',
};

/**
 * Transitions autorisées depuis l'admin. Une commande est « En préparation » dès le dépôt de la preuve de virement ;
 * l'admin la passe « En route » quand le virement est crédité, puis « Livrée ».
 * PENDING_PAYMENT_VERIFICATION et PAID ne concernent que les commandes antérieures à ce suivi.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT_VERIFICATION: ['PREPARING', 'SHIPPED', 'CANCELLED'],
  PAID: ['PREPARING', 'SHIPPED', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Suivi client en 3 étapes : messages affichés sur la page de suivi et envoyés par e-mail à chaque étape. */
export const TRACKING_STEPS = [
  { step: 1, label: 'En préparation', message: 'Votre commande est en préparation auprès du fournisseur. Merci de patienter!' },
  { step: 2, label: 'En route', message: 'Votre commande est déjà en route vers votre adresse.' },
  { step: 3, label: 'Livrée', message: 'Votre commande est arrivée à votre adresse. Merci pour l’achat.' },
] as const;
export type TrackingStep = (typeof TRACKING_STEPS)[number];

/** Étape de suivi d'une commande (null si annulée). */
export function trackingStep(status: OrderStatus): TrackingStep | null {
  if (status === 'CANCELLED') return null;
  if (status === 'DELIVERED') return TRACKING_STEPS[2];
  if (status === 'SHIPPED') return TRACKING_STEPS[1];
  return TRACKING_STEPS[0];
}

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Référence lisible au téléphone, sans caractères ambigus : GLA-261026-7KQ4M. */
export function generateOrderReference(date: Date, randomBytes: Uint8Array): string {
  const y = String(date.getUTCFullYear()).slice(2);
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  let suffix = '';
  for (let i = 0; i < 5; i++) suffix += ALPHABET[(randomBytes[i] ?? 0) % ALPHABET.length];
  return `GLA-${y}${m}${d}-${suffix}`;
}
