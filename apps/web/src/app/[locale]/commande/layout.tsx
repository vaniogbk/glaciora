import type { Metadata } from 'next';
import { I18nProvider } from '@/i18n/client';
import { pick } from '@/i18n/messages';
import { getI18n } from '@/i18n/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { m } = await getI18n(params);
  return { title: m.meta.checkoutTitle, robots: { index: false, follow: false } };
}

/** Textes de la commande, de la confirmation et du suivi : envoyés seulement sur ces pages. */
export default async function Layout({ children, params }: Props & { children: React.ReactNode }) {
  const { m } = await getI18n(params);
  return <I18nProvider messages={pick(m, ['checkout', 'tracking', 'orderStatus', 'paymentStatus', 'followUp'])}>{children}</I18nProvider>;
}
