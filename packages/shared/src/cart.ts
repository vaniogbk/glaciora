export const MAX_QUANTITY_PER_LINE = 10;

export interface CartLineInput {
  variantId: string;
  unitPriceCents: number;
  quantity: number;
  /** Stock disponible au moment du calcul. */
  available: number;
  isPurchasable: boolean;
}

export type CartIssue =
  | { variantId: string; code: 'INVALID_QUANTITY' }
  | { variantId: string; code: 'OUT_OF_STOCK' }
  | { variantId: string; code: 'INSUFFICIENT_STOCK'; available: number }
  | { variantId: string; code: 'NOT_PURCHASABLE' };

export const CART_ISSUE_MESSAGES: Record<CartIssue['code'], string> = {
  INVALID_QUANTITY: 'Quantité invalide',
  OUT_OF_STOCK: 'Article en rupture de stock',
  INSUFFICIENT_STOCK: 'Stock insuffisant pour la quantité demandée',
  NOT_PURCHASABLE: "Cet article n'est plus disponible à la vente",
};

export function validateCartLines(lines: CartLineInput[]): CartIssue[] {
  const issues: CartIssue[] = [];
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY_PER_LINE) {
      issues.push({ variantId: line.variantId, code: 'INVALID_QUANTITY' });
    } else if (!line.isPurchasable) {
      issues.push({ variantId: line.variantId, code: 'NOT_PURCHASABLE' });
    } else if (line.available <= 0) {
      issues.push({ variantId: line.variantId, code: 'OUT_OF_STOCK' });
    } else if (line.quantity > line.available) {
      issues.push({ variantId: line.variantId, code: 'INSUFFICIENT_STOCK', available: line.available });
    }
  }
  return issues;
}

export function computeCartTotals(lines: Pick<CartLineInput, 'unitPriceCents' | 'quantity'>[]) {
  let subtotalCents = 0;
  let itemCount = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) throw new Error('Prix unitaire invalide');
    subtotalCents += line.unitPriceCents * line.quantity;
    itemCount += line.quantity;
  }
  return { subtotalCents, itemCount };
}
