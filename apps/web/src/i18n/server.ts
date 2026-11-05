import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DEFAULT_LOCALE, LOCALES, isLocale, localizePath, type Locale } from './config';
import { getMessages, type Messages } from './messages';

/** Langue de la page (segment [locale]) et ses textes ; 404 pour une langue inconnue. */
export async function getI18n(params: Promise<{ locale: string }>): Promise<{ locale: Locale; m: Messages }> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, m: await getMessages(locale) };
}

/** Adresse canonique de la page dans sa langue + versions dans toutes les autres langues (balises hreflang). */
export function alternates(locale: Locale, path: string): Metadata['alternates'] {
  return {
    canonical: localizePath(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, localizePath(l, path)])),
      'x-default': localizePath(DEFAULT_LOCALE, path),
    },
  };
}
