/**
 * Langues du site (une par pays de livraison). Le français est la langue par défaut, servie sans préfixe d'URL ;
 * les autres sont préfixées (/de/…). Partagé entre le site (affichage) et l'API (e-mails clients, liens de suivi).
 */
export const SITE_LOCALES = ['fr', 'de', 'en', 'es', 'it', 'nl', 'pt', 'pl', 'cs', 'sk', 'sl', 'et', 'lt', 'fi', 'sv', 'nb', 'is', 'ro', 'ka'] as const;
export type SiteLocale = (typeof SITE_LOCALES)[number];
export const DEFAULT_SITE_LOCALE: SiteLocale = 'fr';

export function isSiteLocale(value: unknown): value is SiteLocale {
  return typeof value === 'string' && (SITE_LOCALES as readonly string[]).includes(value);
}

/** Chemin d'une page dans une langue : « /commande/suivi » → « /de/commande/suivi » (français sans préfixe). */
export function localizedPath(locale: string | null | undefined, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (!isSiteLocale(locale) || locale === DEFAULT_SITE_LOCALE) return clean;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`;
}

const REGION: Record<SiteLocale, string> = {
  fr: 'FR', de: 'DE', en: 'GB', es: 'ES', it: 'IT', nl: 'NL', pt: 'PT', pl: 'PL', cs: 'CZ', sk: 'SK', sl: 'SI', et: 'EE', lt: 'LT', fi: 'FI', sv: 'SE', nb: 'NO', is: 'IS', ro: 'RO', ka: 'GE',
};

/** Étiquette complète (« de-DE ») pour les formats de prix et de date. */
export function intlTag(locale: SiteLocale): string {
  return `${locale}-${REGION[locale]}`;
}
