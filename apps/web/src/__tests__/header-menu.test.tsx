import { fireEvent, render, screen } from '@testing-library/react';
import { Header } from '@/components/layout/Header';
import { I18nProvider } from '@/i18n/client';
import fr from '@/i18n/messages/fr';

jest.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/components/providers/CartProvider', () => ({ useCart: () => ({ cart: null, pulse: 0 }) }));
jest.mock('@/components/providers/AuthProvider', () => ({ useAuth: () => ({ user: null }) }));

const renderHeader = () =>
  render(
    <I18nProvider locale="fr" messages={fr}>
      <Header />
    </I18nProvider>,
  );
const menu = () => document.getElementById('menu-mobile')!;

describe('menu mobile', () => {
  it('se referme quand on touche l’écran hors du menu, sans activer ce qui est dessous', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: fr.header.openMenu }));
    expect(menu()).toBeVisible();
    fireEvent.click(screen.getByTestId('menu-backdrop'));
    expect(menu()).not.toBeVisible();
    expect(screen.queryByTestId('menu-backdrop')).not.toBeInTheDocument();
  });

  it('se referme avec la touche Échap et reste ouvert quand on touche le menu lui-même', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: fr.header.openMenu }));
    fireEvent.click(menu());
    expect(menu()).toBeVisible();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(menu()).not.toBeVisible();
  });
});
