'use client';

import { usePathname } from 'next/navigation';
import { useId } from 'react';
import clsx from 'clsx';
import { useI18n } from '@/i18n/client';
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, isLocale, localizePath, stripLocale } from '@/i18n/config';

/**
 * Choix de la langue : mémorisé dans un cookie (prioritaire sur la langue du navigateur), puis même page dans la
 * nouvelle langue. Rechargement complet : la langue change la balise <html lang> et tous les textes.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, m } = useI18n();
  const id = useId();
  const pathname = usePathname();

  function onChange(next: string) {
    if (!isLocale(next) || next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.assign(`${localizePath(next, stripLocale(pathname))}${window.location.search}`);
  }

  return (
    <div className={clsx('relative', className)}>
      <label htmlFor={id} className="sr-only">
        {m.common.language}
      </label>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
      <select
        id={id}
        value={locale}
        onChange={(e) => onChange(e.target.value)}
        data-testid="language-select"
        className="h-11 cursor-pointer appearance-none rounded-md border border-white/20 bg-transparent pl-8 pr-2 text-sm font-semibold uppercase text-white hover:border-white/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-glacier"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l} className="normal-case text-ink">
            {l === locale ? l.toUpperCase() : LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </div>
  );
}

