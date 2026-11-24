import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OrderFollowUp, normalizeReference } from '@/components/order/OrderFollowUp';
import { I18nProvider } from '@/i18n/client';
import fr from '@/i18n/messages/fr';

let search = new URLSearchParams();
const push = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/commande/suivi',
  useSearchParams: () => search,
  useRouter: () => ({ push, replace: jest.fn() }),
}));
const api = jest.fn();
jest.mock('@/lib/api-client', () => ({ api: (...args: unknown[]) => api(...args) }));

const renderTracking = (mode: 'suivi' | 'confirmation' = 'suivi') =>
  render(
    <I18nProvider locale="fr" messages={fr}>
      <OrderFollowUp mode={mode} />
    </I18nProvider>,
  );

beforeEach(() => {
  search = new URLSearchParams();
  push.mockReset();
  api.mockReset();
});

describe('suivi de commande sans compte', () => {
  it('accepte la référence tapée en minuscules, avec des espaces ou sans tirets', () => {
    expect(normalizeReference(' gla-261124-7kq4m ')).toBe('GLA-261124-7KQ4M');
    expect(normalizeReference('GLA 261124 7KQ4M')).toBe('GLA-261124-7KQ4M');
    expect(normalizeReference('gla2611247kq4m')).toBe('GLA-261124-7KQ4M');
  });

  it('propose le champ « Référence de commande » et ouvre le suivi de la commande', () => {
    renderTracking();
    expect(screen.getByRole('heading', { level: 1, name: 'Suivre ma commande' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Référence de commande'), { target: { value: 'gla-261124-7kq4m' } });
    fireEvent.click(screen.getByRole('button', { name: 'Suivre' }));
    expect(push.mock.calls[0]?.[0]).toBe('/commande/suivi?ref=GLA-261124-7KQ4M');
    expect(api).not.toHaveBeenCalled();
  });

  it('refuse une référence mal formée sans appeler le serveur', () => {
    renderTracking();
    fireEvent.change(screen.getByLabelText('Référence de commande'), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Suivre' }));
    expect(screen.getByRole('alert')).toHaveTextContent('GLA-261124-7KQ4M');
    expect(push).not.toHaveBeenCalled();
  });

  it('montre les étapes sans nom, e-mail, adresse ni montant quand on saisit la référence', async () => {
    search = new URLSearchParams('ref=GLA-261124-7KQ4M');
    api.mockResolvedValue({
      order: { limited: true, reference: 'GLA-261124-7KQ4M', status: 'SHIPPED', createdAt: '2026-11-24T10:00:00Z', trackingCarrier: 'Poczta Polska', trackingNumber: 'PX123', trackingUrl: null, items: [{ productName: 'Veste Hero', productSlug: 'veste-hero', sizeLabel: 'M', quantity: 1 }] },
    });
    renderTracking();
    await waitFor(() => expect(screen.getByTestId('order-status')).toHaveTextContent('En route'));
    expect(api).toHaveBeenCalledWith('/api/checkout/orders/GLA-261124-7KQ4M');
    expect(screen.getByTestId('limited-notice')).toBeInTheDocument();
    expect(screen.getByText(/Veste Hero/)).toBeInTheDocument();
    expect(screen.queryByText(/Total payé/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Suivre une autre commande' })).toHaveAttribute('href', '/commande/suivi');
  });

  it('revient au formulaire si la référence est introuvable', async () => {
    search = new URLSearchParams('ref=GLA-261124-ZZZZZ');
    api.mockRejectedValue(new Error('404'));
    renderTracking();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Aucune commande ne correspond'));
    expect(screen.getByLabelText('Référence de commande')).toHaveValue('GLA-261124-ZZZZZ');
  });

  it('met la référence en avant à la fin de la commande, avec un bouton pour la copier', async () => {
    search = new URLSearchParams('ref=GLA-261124-7KQ4M');
    api.mockResolvedValue({
      order: { limited: false, reference: 'GLA-261124-7KQ4M', status: 'PREPARING', createdAt: '2026-11-24T10:00:00Z', email: 'client@example.com', subtotalCents: 10_000, discountCents: 1_500, discountLabel: 'Black Friday -15 %', shippingCents: 2_500, totalCents: 11_000, shippingRateName: 'Poczta Polska', shipCountryCode: 'DE', shipCity: 'Berlin', trackingCarrier: null, trackingNumber: null, trackingUrl: null, items: [{ productName: 'Veste Hero', productSlug: 'veste-hero', sizeLabel: 'M', quantity: 1, lineTotalCents: 10_000 }], proofReceived: true },
    });
    renderTracking('confirmation');
    await waitFor(() => expect(screen.getByTestId('order-reference')).toHaveTextContent('GLA-261124-7KQ4M'));
    expect(screen.getByRole('button', { name: 'Copier' })).toBeInTheDocument();
    expect(screen.getByText('Remise · Black Friday -15 %')).toBeInTheDocument();
    expect(screen.getByText('Total payé')).toBeInTheDocument();
  });
});
