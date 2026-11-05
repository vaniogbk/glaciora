import { fireEvent, render, screen } from '@testing-library/react';
import { AddToCart } from '@/components/product/AddToCart';
import { ColorSelectionProvider } from '@/components/product/ColorSelection';
import { ProductGallery } from '@/components/product/ProductGallery';
import { swatchBackground } from '@/components/product/color-swatch';
import type { ProductVariant } from '@/lib/types';

jest.mock('@/components/providers/CartProvider', () => ({ useCart: () => ({ add: jest.fn() }) }));

const variant = (id: string, color: string, size: string, inStock = true): ProductVariant => ({
  id,
  sku: id,
  color,
  priceCents: 10000,
  compareAtPriceCents: null,
  size: { label: size, system: 'SKI_LENGTH' },
  available: inStock ? 5 : 0,
  inStock,
});

const images = [
  { url: '/media/products/noir.webp', alt: 'Casque coloris Noir', color: 'Noir' },
  { url: '/media/products/bleu.webp', alt: 'Casque coloris Bleu', color: 'Bleu' },
];

function renderProduct() {
  const variants = [variant('n-s', 'Noir', 'S'), variant('n-m', 'Noir', 'M'), variant('b-m', 'Bleu', 'M'), variant('b-l', 'Bleu', 'L', false)];
  render(
    <ColorSelectionProvider initial="Noir">
      <ProductGallery images={images} name="Casque" />
      <AddToCart variants={variants} productName="Casque" />
    </ColorSelectionProvider>,
  );
}

describe('choix du coloris', () => {
  it('change la photo et les tailles au clic sur un coloris, en gardant la taille choisie si elle existe', () => {
    renderProduct();
    expect(screen.getByTestId('product-photo')).toHaveAttribute('alt', 'Casque coloris Noir');
    expect(screen.getAllByRole('radio', { name: /^(S|M|L)/ }).map((r) => r.textContent?.trim())).toEqual(['S', 'M']);

    fireEvent.click(screen.getByRole('radio', { name: 'M' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Bleu' }));

    expect(screen.getByTestId('product-photo')).toHaveAttribute('alt', 'Casque coloris Bleu');
    expect(screen.getByText(/: Bleu/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'M' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /^L/ })).toBeDisabled();
  });

  it('n’affiche aucune mention « visuel d’illustration »', () => {
    renderProduct();
    expect(screen.queryByText(/illustration|non contractuel/i)).not.toBeInTheDocument();
  });

  it('dessine une pastille bicolore pour « Noir / Bleu » et neutre pour un libellé inconnu', () => {
    expect(swatchBackground('Noir / Bleu')).toContain('linear-gradient');
    expect(swatchBackground('Matte Black')).toBe('#15171A');
    expect(swatchBackground('Coloris inconnu')).toBe('#B9C3CD');
  });
});
