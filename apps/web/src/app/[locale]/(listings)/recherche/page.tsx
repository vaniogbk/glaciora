import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CatalogueView, pickParams, type SearchParams } from '@/components/catalogue/CatalogueView';
import { CatalogueBodySkeleton } from '@/components/ui/Skeleton';
import { localizePath } from '@/i18n/config';
import { fmt } from '@/i18n/format';
import { alternates, getI18n } from '@/i18n/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  return { title: m.meta.searchTitle, description: m.meta.searchDescription, robots: { index: false, follow: true }, alternates: alternates(locale, '/recherche') };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale, m } = await getI18n(params);
  const query = pickParams(await searchParams);
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: m.meta.searchTitle, href: '/recherche' }]} locale={locale} m={m} />
      <h1 className="mt-4 text-3xl sm:text-4xl">{query.q ? fmt(m.listing.searchResults, { q: query.q }) : m.meta.searchTitle}</h1>
      <form action={localizePath(locale, '/recherche')} role="search" className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="recherche-page" className="sr-only">
          {m.header.searchLabel}
        </label>
        <input id="recherche-page" name="q" type="search" defaultValue={query.q ?? ''} placeholder={m.listing.searchPlaceholder} className="field-input" />
        <button type="submit" className="btn-primary">
          {m.listing.searchButton}
        </button>
      </form>
      <div className="mt-8">
        <Suspense fallback={<CatalogueBodySkeleton label={m.listing.loadingProducts} />}>
          <CatalogueView basePath="/recherche" params={query} locale={locale} m={m} />
        </Suspense>
      </div>
    </div>
  );
}
