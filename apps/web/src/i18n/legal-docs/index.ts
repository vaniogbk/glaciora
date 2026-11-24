import type { Locale } from '@/i18n/config';
import type { LegalDocs } from './types';

export type { LegalDoc, LegalDocs, LegalSection } from './types';

/** Langues dans lesquelles les conditions de vente et la politique de confidentialité sont rédigées. */
const LOADERS = {
  fr: () => import('./fr'),
  en: () => import('./en'),
  pl: () => import('./pl'),
} as const;
type DocLocale = keyof typeof LOADERS;

/** Texte dans la langue de la page, sinon la version anglaise (la page l'annonce dans la langue du visiteur). */
export async function getLegalDocs(locale: Locale): Promise<{ docs: LegalDocs; lang: DocLocale; fallback: boolean }> {
  const lang: DocLocale = locale in LOADERS ? (locale as DocLocale) : 'en';
  return { docs: (await LOADERS[lang]()).default, lang, fallback: lang !== locale };
}
