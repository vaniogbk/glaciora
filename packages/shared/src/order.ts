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
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_VERIFICATION: 'Virement à vérifier',
  VERIFIED: 'Paiement vérifié',
  REJECTED: 'Paiement refusé',
};

/** Transitions autorisées depuis l'admin. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT_VERIFICATION: ['PAID', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
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
