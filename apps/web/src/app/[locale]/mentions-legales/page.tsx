import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BRAND } from '@glaciora/shared/contact';
import { EMPTY_LEGAL_NOTICE, type LegalField } from '@glaciora/shared/legal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { alternates, getI18n } from '@/i18n/server';
import { getLegalNotice } from '@/lib/server-api';

type Props = { params: Promise<{ locale: string }> };

/** Saisie dans l'admin par le propriétaire : la page se met à jour en quelques minutes. */
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  return { title: m.legal.title, description: m.legal.description, alternates: alternates(locale, '/mentions-legales') };
}

export default async function LegalNoticePage({ params }: Props) {
  const { locale, m } = await getI18n(params);
  const t = m.legal;
  // API injoignable ou fiche jamais saisie : tous les champs restent « à compléter ».
  const notice = (await getLegalNotice()) ?? EMPTY_LEGAL_NOTICE;

  const value = (field: LegalField): ReactNode =>
    notice[field] ? <span className="whitespace-pre-line">{notice[field]}</span> : <span className="italic text-muted">{t.toFill}</span>;
  const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="grid grid-cols-1 gap-1 border-b border-line py-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:gap-4">
      <dt className="font-semibold text-marine">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );

  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: t.title, href: '/mentions-legales' }]} locale={locale} m={m} />
      <h1 className="mt-4 text-3xl sm:text-4xl">{t.title}</h1>

      <section className="mt-8 max-w-3xl" aria-labelledby="editeur">
        <h2 id="editeur" className="text-xl">{t.publisher}</h2>
        <dl className="mt-3 text-sm">
          <Row label={t.companyName}>{value('companyName')}</Row>
          <Row label={t.legalForm}>{value('legalForm')}</Row>
          <Row label={t.shareCapital}>{value('shareCapital')}</Row>
          <Row label={t.registration}>{value('registration')}</Row>
          <Row label={t.vatNumber}>{value('vatNumber')}</Row>
          <Row label={t.headOffice}>{value('headOffice')}</Row>
          <Row label={t.publicationDirector}>{value('publicationDirector')}</Row>
          <Row label={t.contact}>
            <a className="text-deep underline" href={`mailto:${BRAND.email}`}>{BRAND.email}</a> · <a className="text-deep underline" href={`tel:${BRAND.phoneE164}`}>{BRAND.phoneDisplay}</a>
          </Row>
        </dl>
      </section>

      <section className="mt-10 max-w-3xl" aria-labelledby="hebergement">
        <h2 id="hebergement" className="text-xl">{t.hosting}</h2>
        <dl className="mt-3 text-sm">
          <Row label={t.hostName}>{value('hostName')}</Row>
          <Row label={t.hostAddress}>{value('hostAddress')}</Row>
        </dl>
      </section>
    </div>
  );
}
