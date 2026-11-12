import type { MetadataRoute } from 'next';
import { DEFAULT_LOCALE, LOCALES, localizePath } from '@/i18n/config';
import { getSitemapEntries } from '@/lib/server-api';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 3600;

type Entry = { path: string; lastModified?: Date; changeFrequency: 'daily' | 'weekly'; priority: number };

/** Chaque page dans chaque langue, avec ses versions alternatives (hreflang) pour les moteurs de recherche. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getSitemapEntries();
  const pages: Entry[] = [
    { path: '/', changeFrequency: 'daily', priority: 1 },
    { path: '/catalogue', changeFrequency: 'daily', priority: 0.9 },
    { path: '/mentions-legales', changeFrequency: 'weekly', priority: 0.2 },
    ...categories.map((c) => ({ path: `/categorie/${c.slug}`, lastModified: new Date(c.updatedAt), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...products.map((p) => ({ path: `/produit/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
  return pages.flatMap(({ path, ...rest }) => {
    const languages = {
      ...Object.fromEntries(LOCALES.map((l) => [l, absoluteUrl(localizePath(l, path))])),
      'x-default': absoluteUrl(localizePath(DEFAULT_LOCALE, path)),
    };
    return LOCALES.map((locale) => ({ url: absoluteUrl(localizePath(locale, path)), ...rest, alternates: { languages } }));
  });
}
