import type { Locale } from '../config';
import type { Messages } from './fr';

export type { Messages } from './fr';

const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  fr: () => import('./fr'),
  de: () => import('./de'),
  en: () => import('./en'),
  es: () => import('./es'),
  it: () => import('./it'),
  nl: () => import('./nl'),
  pt: () => import('./pt'),
  pl: () => import('./pl'),
  cs: () => import('./cs'),
  sk: () => import('./sk'),
  sl: () => import('./sl'),
  et: () => import('./et'),
  lt: () => import('./lt'),
  fi: () => import('./fi'),
  sv: () => import('./sv'),
  nb: () => import('./nb'),
  is: () => import('./is'),
};

/** Textes d'une langue (serveur). */
export async function getMessages(locale: Locale): Promise<Messages> {
  return (await loaders[locale]()).default;
}

/** Rubriques utilisées par les composants navigateur présents sur toutes les pages (en-tête, fiche, filtres, panier). */
export const CLIENT_NAMESPACES = ['common', 'nav', 'header', 'filters', 'productClient', 'colors', 'validation', 'errors', 'card', 'price', 'notFound', 'errorPage'] as const;

export function pick<K extends keyof Messages>(messages: Messages, keys: readonly K[]): Pick<Messages, K> {
  return Object.fromEntries(keys.map((key) => [key, messages[key]])) as Pick<Messages, K>;
}
