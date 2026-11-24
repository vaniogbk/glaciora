import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { alternates, getI18n } from '@/i18n/server';

type Props = { params: Promise<{ locale: string }> };

/** L'identité du responsable du traitement vient des mentions légales (modifiables dans l'admin). */
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  return { title: m.meta.privacyTitle, description: m.meta.privacyDescription, alternates: alternates(locale, '/confidentialite') };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale, m } = await getI18n(params);
  return <LegalDocument kind="privacy" title={m.meta.privacyTitle} path="/confidentialite" locale={locale} m={m} />;
}
