import { act, render, screen, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '@/components/providers/CartProvider';
import type { Cart, CartLine } from '@/lib/types';

const line: CartLine = {
  variantId: 'v1',
  sku: 'GLA-005-170',
  productName: 'Slap 98',
  brand: 'Zag',
  slug: 'zag-slap-98',
  sizeLabel: '170 cm',
  color: null,
  image: null,
  unitPriceCents: 10000,
  quantity: 1,
  available: 5,
  lineTotalCents: 10000,
  issue: null,
};
const cart = (quantity: number): Cart => ({ items: [{ ...line, quantity, lineTotalCents: 10000 * quantity }], subtotalCents: 10000 * quantity, itemCount: quantity, currency: 'EUR', hasIssues: false });

let pending: { resolve: (v: unknown) => void; reject: (e: unknown) => void } | null = null;
jest.mock('@/lib/api-client', () => ({
  ApiError: class ApiError extends Error {},
  api: jest.fn((path: string, init?: { method?: string }) => {
    if (!init?.method) return Promise.resolve({ cart: cart(1) });
    return new Promise((resolve, reject) => {
      pending = { resolve, reject };
    });
  }),
}));

let actions: ReturnType<typeof useCart> | null = null;
function Probe() {
  actions = useCart();
  return <p data-testid="count">{actions.cart?.itemCount ?? '—'} / {actions.cart?.subtotalCents ?? '—'}</p>;
}

describe('panier optimiste', () => {
  it('affiche la nouvelle quantité avant la réponse du serveur, puis revient en arrière si elle est refusée', async () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1 / 10000'));

    let result: Promise<Cart> | undefined;
    act(() => {
      result = actions!.update('v1', 3);
    });
    expect(screen.getByTestId('count')).toHaveTextContent('3 / 30000');

    await act(async () => {
      pending!.reject(new Error('Stock insuffisant'));
      await expect(result).rejects.toThrow('Stock insuffisant');
    });
    expect(screen.getByTestId('count')).toHaveTextContent('1 / 10000');
  });

  it('garde la réponse du serveur quand elle arrive', async () => {
    render(
      <CartProvider>
        <Probe />
      </CartProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1 / 10000'));
    act(() => {
      void actions!.remove('v1');
    });
    expect(screen.getByTestId('count')).toHaveTextContent('0 / 0');
    await act(async () => {
      pending!.resolve({ cart: { ...cart(1), items: [], itemCount: 0, subtotalCents: 0 } });
    });
    expect(screen.getByTestId('count')).toHaveTextContent('0 / 0');
  });
});
