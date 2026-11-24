import type { Cart } from './types';

/** Remise des packs et remise de la promotion en cours, affichées sur deux lignes (leur somme vaut discountCents). */
export function discountParts(cart: Pick<Cart, 'discountCents' | 'packDiscountCents' | 'promotion'> | null | undefined) {
  const promo = cart?.promotion?.discountCents ?? 0;
  const pack = cart?.packDiscountCents ?? Math.max(0, (cart?.discountCents ?? 0) - promo);
  return { pack, promo };
}
