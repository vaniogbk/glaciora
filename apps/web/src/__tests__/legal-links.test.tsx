import { render, screen } from '@testing-library/react';
import RegisterPage from '@/app/[locale]/compte/inscription/page';
import { I18nProvider } from '@/i18n/client';
import { CLIENT_NAMESPACES, pick } from '@/i18n/messages';
import de from '@/i18n/messages/de';
import fr from '@/i18n/messages/fr';

jest.mock('next/navigation', () => ({ usePathname: () => '/compte/inscription', useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), useSearchParams: () => new URLSearchParams() }));

// Mêmes traductions que sur le site : celles de app/[locale]/layout.tsx puis celles de app/[locale]/compte/layout.tsx.
const ACCOUNT_NAMESPACES = ['account', 'tracking', 'orderStatus', 'paymentStatus', 'legal'] as const;
const renderRegister = (m: typeof fr, locale: 'fr' | 'de') =>
  render(
    <I18nProvider locale={locale} messages={pick(m, CLIENT_NAMESPACES)}>
      <I18nProvider messages={pick(m, ACCOUNT_NAMESPACES)}>
        <RegisterPage />
      </I18nProvider>
    </I18nProvider>,
  );

describe('mention de confidentialité à l’inscription', () => {
  it('renvoie vers la politique de confidentialité (français)', () => {
    renderRegister(fr, 'fr');
    expect(screen.getByRole('link', { name: 'politique de confidentialité' })).toHaveAttribute('href', '/confidentialite');
  });

  it('est traduite et garde le préfixe de langue (allemand)', () => {
    renderRegister(de, 'de');
    expect(screen.getByRole('link', { name: 'Datenschutzerklärung' })).toHaveAttribute('href', '/de/confidentialite');
  });
});
