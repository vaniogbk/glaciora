import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/AdminShell';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { I18nProvider } from '@/i18n/client';
import { CLIENT_NAMESPACES, getMessages, pick } from '@/i18n/messages';
import { fontVariables } from '../fonts';

export const metadata: Metadata = { title: 'Administration | GLACIORA', robots: { index: false, follow: false } };

/** Administration : en français uniquement, hors des versions traduites de la boutique. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const m = await getMessages('fr');
  return (
    <html lang="fr" className={fontVariables}>
      <body>
        <I18nProvider locale="fr" messages={pick(m, [...CLIENT_NAMESPACES, 'tracking'])}>
          <AuthProvider>
            <AdminShell>{children}</AdminShell>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
