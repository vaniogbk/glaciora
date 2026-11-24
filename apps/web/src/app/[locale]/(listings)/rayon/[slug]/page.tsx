import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AUDIENCES, type AudienceSlug } from '@glaciora/shared/schemas';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CatalogueView, pickParams, type SearchParams } from '@/components/catalogue/CatalogueView';
import { CatalogueBodySkeleton } from '@/components/ui/Skeleton';
import { fmt } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import { alternates, getI18n } from '@/i18n/server';

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<SearchParams> };

const isAudience = (slug: string): slug is AudienceSlug => (AUDIENCES as readonly string[]).includes(slug);

/** Libellé du rayon (Hommes, Femmes, Enfants) dans la langue de la page. */
function audienceLabel(slug: AudienceSlug, m: Messages) {
  return { hommes: m.nav.men, femmes: m.nav.women, enfants: m.nav.kids }[slug];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  const { slug } = await params;
  if (!isAudience(slug)) return { title: m.meta.categoryNotFound };
  const name = audienceLabel(slug, m);
  return {
    title: fmt(m.meta.categoryTitle, { name }),
    description: fmt(m.meta.categoryDescription, { name, intro: m.listing.audienceIntros[slug] }),
    alternates: alternates(locale, `/rayon/${slug}`),
  };
}

/** Rayon Hommes / Femmes / Enfants : le catalogue filtré par public, avec les mêmes filtres que les catégories. */
export default async function AudiencePage({ params, searchParams }: Props) {
  const [{ locale, m }, { slug }, query] = await Promise.all([getI18n(params), params, searchParams]);
  if (!isAudience(slug)) notFound();
  const name = audienceLabel(slug, m);
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: name, href: `/rayon/${slug}` }]} locale={locale} m={m} />
      <h1 className="mt-4 text-3xl sm:text-4xl">{name}</h1>
      <p className="mt-2 max-w-2xl text-muted">{m.listing.audienceIntros[slug]}</p>
      <div className="mt-8">
        <Suspense fallback={<CatalogueBodySkeleton label={m.listing.loadingProducts} />}>
          <CatalogueView basePath={`/rayon/${slug}`} params={pickParams(query, { audience: slug })} locale={locale} m={m} />
        </Suspense>
      </div>
    </div>
  );
}
