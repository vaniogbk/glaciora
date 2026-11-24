import { render, screen, within } from '@testing-library/react';
import { BlackFridayBoard } from '@/components/promo/BlackFridayBoard';
import { PromoStrip } from '@/components/promo/PromoStrip';
import { I18nProvider } from '@/i18n/client';
import { promoLastDay } from '@/i18n/format';
import en from '@/i18n/messages/en';
import fr from '@/i18n/messages/fr';
import pl from '@/i18n/messages/pl';
import { discountParts } from '@/lib/cart-discounts';
import type { ProductCard, Promotion } from '@/lib/types';

jest.mock('next/navigation', () => ({ usePathname: () => '/' }));

const promotion: Promotion = { code: 'BLACK_FRIDAY_2026', name: 'Black Friday', percent: 15, endsAt: '2026-12-01T00:00:00+01:00' };
const product = (id: string): ProductCard =>
  ({
    id,
    slug: `produit-${id}`,
    name: `Veste ${id}`,
    brand: 'Rossignol',
    image: { url: `/media/products/${id}.webp`, alt: `Veste ${id}`, width: 800, height: 800 },
  }) as ProductCard;

describe('annonce Black Friday', () => {
  it('donne le dernier jour de l’offre, heure de Varsovie, dans chaque langue', () => {
    expect(promoLastDay(promotion.endsAt, 'fr')).toBe('30 novembre');
    expect(promoLastDay(promotion.endsAt, 'en')).toMatch(/30 November|November 30/);
    expect(promoLastDay(promotion.endsAt, 'pl')).toBe('30 listopada');
  });

  it('épingle l’offre réelle, les avantages et de vrais articles au tableau', () => {
    render(
      <I18nProvider locale="fr" messages={fr}>
        <BlackFridayBoard promotion={promotion} products={[product('a'), product('b'), product('c')]} locale="fr" m={fr} />
      </I18nProvider>,
    );
    const board = screen.getByTestId('black-friday-board');
    expect(within(board).getByRole('heading', { level: 2, name: fr.promo.boardTitle })).toBeInTheDocument();
    expect(board.textContent).toMatch(/-15\s?%/);
    expect(board.textContent).toContain('Le 30 novembre à minuit, heure de Varsovie.');
    expect(board.textContent).toContain(fr.promo.finePrint);
    expect(within(board).getAllByRole('figure')).toHaveLength(2);
    expect(within(board).getByRole('link', { name: /Mener l’enquête/ })).toHaveAttribute('href', '/catalogue');
    expect(board.querySelectorAll('[data-pin]').length).toBe(7);
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
