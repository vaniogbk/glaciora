import { render, screen } from '@testing-library/react';
import { Price } from '@/components/product/Price';
import { ProductCard } from '@/components/product/ProductCard';
import { Footer } from '@/components/layout/Footer';
import type { ProductCard as ProductCardData } from '@/lib/types';

jest.mock('next/navigation', () => ({ usePathname: () => '/' }));

const product: ProductCardData = {
  id: 'p1',
  reference: 'GLA-005',
  slug: 'zag-slap-98',
  name: 'Slap 98',
  brand: 'Zag',
  sport: 'SKI',
  condition: 'NEW',
  category: { slug: 'skis-all-mountain-freeride', name: 'Skis all-mountain & freeride' },
  currency: 'EUR',
  priceFromCents: 45490,
  hasPriceRange: false,
  compareAtPriceCents: 64990,
  isNew: true,
  isFeatured: true,
  inStock: false,
  sizes: ['173 cm'],
  image: { url: '/media/products/zag.webp', alt: 'Zag Slap 98 — visuel d’illustration', width: 1024, height: 1024 },
  imagesAreIllustrations: true,
};

describe('Price', () => {
  it('affiche le prix, le prix barré et la remise', () => {
    render(<Price cents={45490} compareAtCents={64990} />);
    expect(screen.getByText(/454,90/)).toBeInTheDocument();
    expect(screen.getByText(/649,90/).tagName).toBe('S');
    expect(screen.getByText('-30 %')).toBeInTheDocument();
  });

  it('n’invente pas de prix quand il est absent', () => {
    render(<Price cents={null} />);
    expect(screen.getByText('Prix bientôt disponible')).toBeInTheDocument();
  });
});

describe('ProductCard', () => {
  it('relie la fiche produit, affiche la marque, le texte alternatif et la disponibilité réelle', () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole('link', { name: 'Slap 98' })).toHaveAttribute('href', '/produit/zag-slap-98');
    expect(screen.getByAltText('Zag Slap 98 — visuel d’illustration')).toBeInTheDocument();
    expect(screen.getByText('Rupture de stock')).toBeInTheDocument();
    expect(screen.getByText('Nouveau')).toBeInTheDocument();
  });
});

describe('Footer', () => {
  it('affiche les coordonnées cliquables et aucun lien « Mentions légales »', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'glacioara@outlook.fr' })).toHaveAttribute('href', 'mailto:glacioara@outlook.fr');
    expect(screen.getByRole('link', { name: /Appeler le \+33 7 56 97 38 64/ })).toHaveAttribute('href', 'tel:+33756973864');
    expect(screen.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', 'https://wa.me/33756973864');
    expect(screen.getByText(/92110 Clichy, Hauts-de-Seine/)).toBeInTheDocument();
    expect(screen.queryByText(/mentions légales/i)).not.toBeInTheDocument();
  });
});
