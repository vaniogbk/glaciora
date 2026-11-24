import { PROMOTIONS, activePromotion, type Promotion } from '@glaciora/shared';

/**
 * Promotion en cours (Black Friday…), seule source du panier, de la commande et de l'annonce du site.
 * GLACIORA_PROMOTIONS=off la désactive : les tests vérifient les montants sans dépendre de la date du jour.
 */
export function currentPromotion(now: Date = new Date(), promotions: readonly Promotion[] = PROMOTIONS): Promotion | null {
  if (process.env.GLACIORA_PROMOTIONS === 'off') return null;
  return activePromotion(now, promotions);
}
