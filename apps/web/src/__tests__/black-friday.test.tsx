import { render, screen } from '@testing-library/react';
import { PromoStrip } from '@/components/promo/PromoStrip';
import { I18nProvider } from '@/i18n/client';
import { promoLastDay } from '@/i18n/format';
import en from '@/i18n/messages/en';
import pl from '@/i18n/messages/pl';
import { discountParts } from '@/lib/cart-discounts';
import type { Promotion } from '@/lib/types';

jest.mock('next/navigation', () => ({ usePathname: () => '/' }));

const promotion: Promotion = { code: 'BLACK_FRIDAY_2026', name: 'Black Friday', percent: 15, endsAt: '2026-12-01T00:00:00+01:00' };
describe('annonce Black Friday', () => {
  it('donne le dernier jour de l’offre, heure de Varsovie, dans chaque langue', () => {
    expect(promoLastDay(promotion.endsAt, 'fr')).toBe('30 novembre');
    expect(promoLastDay(promotion.endsAt, 'en')).toMatch(/30 November|November 30/);
    expect(promoLastDay(promotion.endsAt, 'pl')).toBe('30 listopada');
  });

  it('annonce l’offre en haut des pages, traduite', () => {
    render(
      <I18nProvider locale="pl" messages={pl}>
        <PromoStrip promotion={promotion} locale="pl" m={pl} />
      </I18nProvider>,
    );
    expect(screen.getByTestId('promo-strip').textContent).toContain('Black Friday: -15% na cały katalog do 30 listopada');
    expect(screen.getByRole('link', { name: /Skorzystaj/ })).toHaveAttribute('href', '/pl/catalogue');
  });

  it('sépare la remise des packs et celle du Black Friday au panier', () => {
    expect(discountParts({ discountCents: 3_000, packDiscountCents: 1_000, promotion: { ...promotion, discountCents: 2_000 } })).toEqual({ pack: 1_000, promo: 2_000 });
    expect(discountParts({ discountCents: 1_000 })).toEqual({ pack: 1_000, promo: 0 });
    expect(en.promo.cartLine).toBe('Black Friday -{percent}%');
  });
});
