/**
 * Promotions saisonnières appliquées automatiquement au panier (sans code), sur le montant des articles après la remise
 * des packs ; jamais sur la livraison. L'API est seule à calculer le montant à payer ; le site n'affiche l'annonce que
 * si l'API renvoie la promotion active (l'annonce et le prix restent ainsi toujours cohérents).
 * Prix de référence (directive Omnibus) : les prix en vigueur à l'ouverture de la promotion sont les plus bas pratiqués
 * depuis la mise en vente (vérifié sur l'historique des instantanés du catalogue le 2026-11-24).
 */
export interface Promotion {
  code: string;
  name: string;
  percent: number;
  /** Début et fin (exclue), heure de Varsovie. */
  startsAt: string;
  endsAt: string;
}

export const PROMOTIONS: readonly Promotion[] = [
  // Offre décidée par la boutique le 2026-11-24 : -15 % sur tout le catalogue jusqu'au lundi 30 novembre inclus.
  { code: 'BLACK_FRIDAY_2026', name: 'Black Friday', percent: 15, startsAt: '2026-11-24T00:00:00+01:00', endsAt: '2026-12-01T00:00:00+01:00' },
];

export function activePromotion(now: Date = new Date(), promotions: readonly Promotion[] = PROMOTIONS): Promotion | null {
  const t = now.getTime();
  return promotions.find((p) => t >= Date.parse(p.startsAt) && t < Date.parse(p.endsAt)) ?? null;
}

/** Remise de la promotion sur un montant d'articles, arrondie au centime. */
export function promotionDiscountCents(amountCents: number, percent: number): number {
  return Math.round((Math.max(0, amountCents) * percent) / 100);
}
