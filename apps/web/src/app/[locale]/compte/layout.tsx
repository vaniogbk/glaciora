import type { Metadata } from 'next';
import { I18nProvider } from '@/i18n/client';
import { pick } from '@/i18n/messages';
import { getI18n } from '@/i18n/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { m } = await getI18n(params);
  return { title: m.meta.accountTitle, robots: { index: false, follow: false } };
}

export default async function Layout({ children, params }: Props & { children: React.ReactNode }) {
  const { m } = await getI18n(params);
  return (
    <I18nProvider messages={pick(m, ['account', 'tracking', 'orderStatus', 'paymentStatus'])}>
      <div className="container py-10">{children}</div>
    </I18nProvider>
  );
}
