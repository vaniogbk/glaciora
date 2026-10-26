import { computeCartTotals, validateCartLines, MAX_QUANTITY_PER_LINE } from '../cart';
import { quoteShipping, selectShippingQuote, type ShippingZoneConfig } from '../shipping';
import { formatPrice, toCents } from '../money';

describe('panier', () => {
  it('calcule le sous-total et le nombre d’articles', () => {
    expect(computeCartTotals([{ unitPriceCents: 44990, quantity: 2 }, { unitPriceCents: 1290, quantity: 3 }])).toEqual({
      subtotalCents: 93850,
      itemCount: 5,
    });
  });

  it('refuse un prix négatif', () => {
    expect(() => computeCartTotals([{ unitPriceCents: -1, quantity: 1 }])).toThrow();
  });

  it('signale stock insuffisant, rupture, quantité invalide et article non vendable', () => {
    const issues = validateCartLines([
      { variantId: 'a', unitPriceCents: 100, quantity: 3, available: 2, isPurchasable: true },
      { variantId: 'b', unitPriceCents: 100, quantity: 1, available: 0, isPurchasable: true },
      { variantId: 'c', unitPriceCents: 100, quantity: MAX_QUANTITY_PER_LINE + 1, available: 50, isPurchasable: true },
      { variantId: 'd', unitPriceCents: 100, quantity: 1, available: 5, isPurchasable: false },
      { variantId: 'e', unitPriceCents: 100, quantity: 2, available: 2, isPurchasable: true },
    ]);
    expect(issues).toEqual([
      { variantId: 'a', code: 'INSUFFICIENT_STOCK', available: 2 },
      { variantId: 'b', code: 'OUT_OF_STOCK' },
      { variantId: 'c', code: 'INVALID_QUANTITY' },
      { variantId: 'd', code: 'NOT_PURCHASABLE' },
    ]);
  });
});

describe('frais de livraison', () => {
  const zones: ShippingZoneConfig[] = [
    {
      id: 'fr',
      name: 'France',
      isActive: true,
      countries: ['FR'],
      rates: [
        { id: 'std', name: 'Standard', priceCents: 990, freeAboveCents: 15000, isActive: true },
        { id: 'exp', name: 'Express', priceCents: 1990, isActive: true },
        { id: 'off', name: 'Désactivé', priceCents: 100, isActive: false },
      ],
    },
    { id: 'eu', name: 'Europe', isActive: false, countries: ['DE'], rates: [{ id: 'x', name: 'X', priceCents: 1, isActive: true }] },
  ];

  it('trie les tarifs actifs du moins cher au plus cher', () => {
    expect(quoteShipping(zones, 'fr', 5000).map((q) => q.rateId)).toEqual(['std', 'exp']);
  });

  it('applique la gratuité au-dessus du seuil', () => {
    const quote = selectShippingQuote(zones, 'FR', 15000, 'std');
    expect(quote).toMatchObject({ priceCents: 0, isFree: true });
  });

  it('ne propose rien pour un pays hors zone ou une zone inactive', () => {
    expect(quoteShipping(zones, 'DE', 5000)).toEqual([]);
    expect(quoteShipping(zones, 'IT', 5000)).toEqual([]);
  });

  it('retourne null pour un tarif inconnu', () => {
    expect(selectShippingQuote(zones, 'FR', 5000, 'inconnu')).toBeNull();
  });
});

describe('montants', () => {
  it('convertit en centimes sans erreur d’arrondi', () => {
    expect(toCents('449,90')).toBe(44990);
    expect(toCents(19.99)).toBe(1999);
    expect(() => toCents('abc')).toThrow();
  });

  it('formate en euros', () => {
    expect(formatPrice(44990).replace(/\s/g, ' ')).toMatch(/449,90\s?€/);
  });
});
