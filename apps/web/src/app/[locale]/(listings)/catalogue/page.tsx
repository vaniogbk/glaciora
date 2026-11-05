import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CatalogueView, pickParams, type SearchParams } from '@/components/catalogue/CatalogueView';
import { CatalogueBodySkeleton } from '@/components/ui/Skeleton';
import { alternates, getI18n } from '@/i18n/server';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  return { title: m.meta.catalogueTitle, description: m.meta.catalogueDescription, alternates: alternates(locale, '/catalogue') };
}

export default async function CataloguePage({ params, searchParams }: Props) {
  const { locale, m } = await getI18n(params);
  const query = pickParams(await searchParams);
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: m.common.catalogue, href: '/catalogue' }]} locale={locale} m={m} />
      <h1 className="mt-4 text-3xl sm:text-4xl">{m.common.catalogue}</h1>
      <p className="mt-2 max-w-2xl text-muted">{m.listing.catalogueIntro}</p>
      <div className="mt-8">
        <Suspense fallback={<CatalogueBodySkeleton label={m.listing.loadingProducts} />}>
          <CatalogueView basePath="/catalogue" params={query} locale={locale} m={m} />
        </Suspense>
      </div>
    </div>
  );
}
