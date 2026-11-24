import { BRAND } from '@glaciora/shared/contact';
import { EMPTY_LEGAL_NOTICE, withLegalDefaults } from '@glaciora/shared/legal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import type { Locale } from '@/i18n/config';
import { fmt } from '@/i18n/format';
import { getLegalDocs, type LegalDocs } from '@/i18n/legal-docs';
import type { Messages } from '@/i18n/messages';
import { getLegalNotice } from '@/lib/server-api';
import { SITE_URL } from '@/lib/site';

/**
 * Conditions générales de vente ou politique de confidentialité. L'identité du vendeur vient des mentions légales
 * (valeurs vérifiées au registre, remplaçables dans l'admin) : les trois pages restent toujours cohérentes.
 */
export async function LegalDocument({ kind, title, path, locale, m }: { kind: keyof LegalDocs; title: string; path: string; locale: Locale; m: Messages }) {
  const [{ docs, lang, fallback }, rawNotice] = await Promise.all([getLegalDocs(locale), getLegalNotice()]);
  const notice = withLegalDefaults(rawNotice ?? EMPTY_LEGAL_NOTICE);
  const doc = docs[kind];
  const vars = {
    brand: BRAND.name,
    site: SITE_URL.replace(/^https?:\/\//, ''),
    seller: notice.companyName ?? BRAND.name,
    legalForm: notice.legalForm ?? '—',
    registration: [notice.registration, notice.vatNumber ? `VAT ${notice.vatNumber}` : null].filter(Boolean).join(' · '),
    address: (notice.headOffice ?? '').split('\n').map((l) => l.trim()).filter(Boolean).join(', '),
    email: BRAND.email,
    phone: BRAND.phoneDisplay,
  };
  const t = (text: string) => fmt(text, vars);

  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: title, href: path }]} locale={locale} m={m} />
      <h1 className="mt-4 text-3xl sm:text-4xl">{title}</h1>
      {fallback && <p className="mt-4 max-w-3xl rounded-md bg-snow p-4 text-sm">{m.legal.docsFallback}</p>}
      <article lang={lang} className="mt-6 max-w-3xl text-sm leading-relaxed">
        <p className="font-semibold text-muted">{doc.version}</p>
        <div className="mt-4 space-y-2">
          {doc.intro.map((p, i) => (
            <p key={i}>{t(p)}</p>
          ))}
        </div>
        <div className="mt-8 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl">{section.title}</h2>
              <div className="mt-2 space-y-2">
                {section.paragraphs?.map((p, i) => (
                  <p key={i}>{t(p)}</p>
                ))}
                {section.list && (
                  <ul className="list-disc space-y-1 pl-5">
                    {section.list.map((item, i) => (
                      <li key={i}>{t(item)}</li>
                    ))}
                  </ul>
                )}
                {section.after?.map((p, i) => (
                  <p key={i}>{t(p)}</p>
                ))}
              </div>
            </section>
          ))}
          {doc.annex && (
            <section>
              <h2 className="text-xl">{doc.annex.title}</h2>
              <div className="mt-2 space-y-2 rounded-md bg-snow p-4">
                <p className="italic">{doc.annex.note}</p>
                {doc.annex.lines.map((line, i) => (
                  <p key={i}>{t(line)}</p>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
