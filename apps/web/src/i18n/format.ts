import { formatPrice } from '@glaciora/shared/money';
import { intlLocale, type Locale } from './config';

/** Remplace les {variables} d'un texte traduit. */
export function fmt(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/** Formes du pluriel selon la langue (règles CLDR : « one », « few », « many », « other »…). « other » est obligatoire. */
export type PluralForms = { other: string } & Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many', string>>;

export function plural(locale: Locale, count: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(intlLocale(locale)).select(count) as keyof PluralForms;
  return fmt(forms[rule] ?? forms.other, { count });
}

export const money = (cents: number, locale: Locale) => formatPrice(cents, intlLocale(locale));

export function formatDate(value: string | Date, locale: Locale, options: Intl.DateTimeFormatOptions = { dateStyle: 'long' }): string {
  return new Intl.DateTimeFormat(intlLocale(locale), options).format(new Date(value));
}

/** Nom d'un pays dans la langue du visiteur (code ISO à 2 lettres), sinon le nom fourni par l'API. */
export function countryName(code: string, locale: Locale, fallback?: string): string {
  try {
    return new Intl.DisplayNames([intlLocale(locale)], { type: 'region' }).of(code) ?? fallback ?? code;
  } catch {
    return fallback ?? code;
  }
}
