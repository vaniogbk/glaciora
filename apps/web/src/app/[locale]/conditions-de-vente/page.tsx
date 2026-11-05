import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BRAND } from '@glaciora/shared/contact';
import { fmt } from '@/i18n/format';
import { alternates, getI18n } from '@/i18n/server';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  return { title: m.meta.termsTitle, description: m.meta.termsDescription, alternates: alternates(locale, '/conditions-de-vente') };
}

/** Mention que seul GLACIORA peut fournir (identité légale, choix commerciaux) : surlignée tant qu'elle n'est pas remplie. */
function ToFill({ label, children }: { label: string; children: ReactNode }) {
  return (
    <mark className="rounded-sm bg-warning/20 px-1 font-semibold text-marine">
      [{label} : {children}]
    </mark>
  );
}

/** Paragraphe traduit : {brand}, {email}… remplacés ; [[…]] affiché comme mention à compléter. */
function Paragraph({ text, vars, toFill }: { text: string; vars: Record<string, string>; toFill: string }) {
  const parts = fmt(text, vars).split(/\[\[(.+?)\]\]/);
  return <p>{parts.map((part, i) => (i % 2 === 1 ? <ToFill key={i} label={toFill}>{part}</ToFill> : part))}</p>;
}

/**
 * Modèle de CGV de vente à distance aux consommateurs (droit français, clients de l'UE), aligné sur le fonctionnement réel
 * du site : virement SEPA avec preuve, suivi en 3 étapes, conservation des preuves (PROOF_RETENTION_DAYS, 400 jours par défaut).
 * Les mentions surlignées dépendent de GLACIORA ; le texte est à faire valider avant usage. Les traductions sont indicatives :
 * la version française fait foi.
 */
export default async function TermsPage({ params }: Props) {
  const { m } = await getI18n(params);
  const t = m.terms;
  const vars = {
    brand: BRAND.name,
    email: BRAND.email,
    phone: BRAND.phoneDisplay,
    address: `${BRAND.streetAddress}, ${BRAND.postalCode} ${BRAND.addressLocality}, France`,
  };
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl sm:text-4xl">{m.meta.termsTitle}</h1>
      <p className="mt-4 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm font-semibold text-warning">{t.draft}</p>
      {t.translationNotice && <p className="mt-3 text-sm text-muted">{t.translationNotice}</p>}
      <div className="mt-8 space-y-8 text-sm leading-relaxed">
        {t.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl">{section.title}</h2>
            <div className="mt-2 space-y-2">
              {section.paragraphs.map((text, i) => (
                <Paragraph key={i} text={text} vars={vars} toFill={t.toFill} />
              ))}
            </div>
          </section>
        ))}
        <section>
          <h2 className="text-xl">{t.annexTitle}</h2>
          <div className="mt-2 space-y-2 rounded-md bg-snow p-4">
            {t.annex.map((text, i) => (
              <Paragraph key={i} text={text} vars={vars} toFill={t.toFill} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
