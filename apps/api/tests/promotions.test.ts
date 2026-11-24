import { PROMOTIONS, activePromotion, promotionDiscountCents } from '@glaciora/shared';
import { currentPromotion } from '../src/lib/promotions';
import { toCartView, type CartItemRow } from '../src/modules/cart/cart.service';

const at = (iso: string) => new Date(iso);
const item = (reference: string, priceCents: number, quantity = 1) =>
  ({
    variantId: `v-${reference}`,
    quantity,
    variant: {
      sku: `SKU-${reference}`,
      priceCents,
      isActive: true,
      color: null,
      size: null,
      stock: { quantity: 30 },
      product: { id: `p-${reference}`, name: reference, slug: reference.toLowerCase(), brand: 'Test', reference, status: 'ACTIVE', images: [] },
    },
  }) as unknown as CartItemRow;

describe('Black Friday 2026 (-15 % sur tout, jusqu’au 30 novembre inclus)', () => {
  const env = process.env.GLACIORA_PROMOTIONS;
  afterEach(() => {
    process.env.GLACIORA_PROMOTIONS = env;
  });

  it('commence le 24 novembre et se termine le 30 novembre à minuit, heure de Varsovie', () => {
    expect(activePromotion(at('2026-11-23T23:59:59+01:00'))).toBeNull();
    expect(activePromotion(at('2026-11-24T00:00:00+01:00'))?.percent).toBe(15);
    expect(activePromotion(at('2026-11-30T23:59:59+01:00'))?.code).toBe('BLACK_FRIDAY_2026');
    expect(activePromotion(at('2026-12-01T00:00:00+01:00'))).toBeNull();
    expect(PROMOTIONS).toHaveLength(1);
  });

  it('peut être coupée par GLACIORA_PROMOTIONS=off (tests)', () => {
    process.env.GLACIORA_PROMOTIONS = 'off';
    expect(currentPromotion(at('2026-11-27T12:00:00+01:00'))).toBeNull();
    process.env.GLACIORA_PROMOTIONS = '';
    expect(currentPromotion(at('2026-11-27T12:00:00+01:00'))?.percent).toBe(15);
  });

  it('retire 15 % du montant des articles au panier, arrondi au centime', () => {
    process.env.GLACIORA_PROMOTIONS = '';
    const view = toCartView([item('GLA-900', 34_490), item('GLA-901', 8_990, 2)], at('2026-11-27T12:00:00+01:00'));
    expect(view.subtotalCents).toBe(52_470);
    expect(view.packDiscountCents).toBe(0);
    expect(view.promotion).toMatchObject({ code: 'BLACK_FRIDAY_2026', percent: 15, discountCents: promotionDiscountCents(52_470, 15) });
    expect(view.discountCents).toBe(7_871);
    expect(view.totalCents).toBe(52_470 - 7_871);
  });

  it('ne change rien après la fin de l’offre', () => {
    process.env.GLACIORA_PROMOTIONS = '';
    const view = toCartView([item('GLA-900', 34_490)], at('2026-12-01T00:00:01+01:00'));
    expect(view.promotion).toBeNull();
    expect(view.discountCents).toBe(0);
    expect(view.totalCents).toBe(34_490);
  });
});
