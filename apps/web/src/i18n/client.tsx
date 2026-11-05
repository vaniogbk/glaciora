'use client';

import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, type ComponentProps, type ReactNode } from 'react';
import { DEFAULT_LOCALE, localizePath, type Locale } from './config';
import type { Messages } from './messages/fr';

interface I18nValue {
  locale: Locale;
  m: Messages;
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Textes des composants navigateur. Seules les rubriques utiles sont envoyées (allège chaque page) : la mise en page
 * fournit les rubriques communes, les pages Panier / Commande / Compte ajoutent les leurs par un second fournisseur.
 */
export function I18nProvider({ locale, messages, children }: { locale?: Locale; messages: Partial<Messages>; children: ReactNode }) {
  const parent = useContext(I18nContext);
  const value = useMemo<I18nValue>(
    () => ({ locale: locale ?? parent?.locale ?? DEFAULT_LOCALE, m: { ...(parent?.m ?? {}), ...messages } as Messages }),
    [locale, messages, parent],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n doit être utilisé dans I18nProvider');
  return ctx;
}

/** Lien interne dans la langue courante (« /panier » devient « /de/panier » en allemand). */
export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { locale } = useI18n();
  const target = typeof href === 'string' && href.startsWith('/') ? localizePath(locale, href) : href;
  return <NextLink href={target} {...props} />;
}

/** Navigation programmée dans la langue courante. */
export function useLocalizedRouter() {
  const router = useRouter();
  const { locale } = useI18n();
  const to = useCallback((path: string) => localizePath(locale, path), [locale]);
  return useMemo(
    () => ({
      push: (path: string, options?: { scroll?: boolean }) => router.push(to(path), options),
      replace: (path: string, options?: { scroll?: boolean }) => router.replace(to(path), options),
      refresh: () => router.refresh(),
      to,
    }),
    [router, to],
  );
}
