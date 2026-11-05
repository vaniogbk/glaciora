/**
 * Langues du site : une par pays de livraison (Allemagne/Autriche/Suisse/Liechtenstein/Luxembourg → allemand,
 * Belgique/Pays-Bas → néerlandais, Norvège → norvégien bokmål, etc.). Le français reste sans préfixe d'URL
 * (/produit/…) ; les autres langues sont préfixées (/de/produit/…). La langue du navigateur choisit la version.
 */
import { SITE_LOCALES, type SiteLocale } from '@glaciora/shared/locales';

export const LOCALES = SITE_LOCALES;
export type Locale = SiteLocale;
export const DEFAULT_LOCALE: Locale = 'fr';
/** Cookie posé par le sélecteur de langue (et à la première détection) : prioritaire sur la langue du navigateur. */
export const LOCALE_COOKIE = 'glaciora_lang';

/** Nom de chaque langue dans sa propre langue (sélecteur). */
export const LOCALE_NAMES: Record<Locale, string> = {
  fr: 'Français',
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  it: 'Italiano',
  nl: 'Nederlands',
  pt: 'Português',
  pl: 'Polski',
  cs: 'Čeština',
  sk: 'Slovenčina',
  sl: 'Slovenščina',
  et: 'Eesti',
  lt: 'Lietuvių',
  fi: 'Suomi',
  sv: 'Svenska',
  nb: 'Norsk',
  is: 'Íslenska',
};

/** Étiquette complète pour les formats (prix, dates) et Open Graph. */
const REGION: Record<Locale, string> = {
  fr: 'FR', de: 'DE', en: 'GB', es: 'ES', it: 'IT', nl: 'NL', pt: 'PT', pl: 'PL', cs: 'CZ', sk: 'SK', sl: 'SI', et: 'EE', lt: 'LT', fi: 'FI', sv: 'SE', nb: 'NO', is: 'IS',
};
export const intlLocale = (locale: Locale) => `${locale}-${REGION[locale]}`;
export const ogLocale = (locale: Locale) => `${locale}_${REGION[locale]}`;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Chemin public d'une page dans une langue : « /produit/x » → « /de/produit/x » (français sans préfixe). */
export function localizePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

/** Retire le préfixe de langue d'un chemin : « /de/produit/x » → « /produit/x ». */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split('/');
  if (isLocale(first)) return `/${rest.join('/')}`;
  return pathname || '/';
}

/** Codes de langue du navigateur rattachés à une langue du site (norvégien : no / nn → bokmål). */
const ALIASES: Record<string, Locale> = { no: 'nb', nn: 'nb' };

/** Meilleure langue du site pour l'en-tête Accept-Language (pondérations q respectées), sinon null. */
export function matchLocale(acceptLanguage: string | null | undefined): Locale | null {
  if (!acceptLanguage) return null;
  const ranked = acceptLanguage
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1, index };
    })
    .filter((entry) => entry.tag && entry.tag !== '*' && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { tag } of ranked) {
    const base = tag.split('-')[0]!;
    if (isLocale(base)) return base;
    const alias = ALIASES[base];
    if (alias) return alias;
  }
  return null;
}
