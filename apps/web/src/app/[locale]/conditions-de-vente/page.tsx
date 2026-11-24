import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { alternates, getI18n } from '@/i18n/server';

type Props = { params: Promise<{ locale: string }> };

/** L'identité du vendeur vient des mentions légales (modifiables dans l'admin) : la page se met à jour en quelques minutes. */
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  return { title: m.meta.termsTitle, description: m.meta.termsDescription, alternates: alternates(locale, '/conditions-de-vente') };
}

export default async function TermsPage({ params }: Props) {
  const { locale, m } = await getI18n(params);
  return <LegalDocument kind="terms" title={m.meta.termsTitle} path="/conditions-de-vente" locale={locale} m={m} />;
}
