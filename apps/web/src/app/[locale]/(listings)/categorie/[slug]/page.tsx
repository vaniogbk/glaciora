import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CatalogueView, pickParams, type SearchParams } from '@/components/catalogue/CatalogueView';
import { CatalogueBodySkeleton } from '@/components/ui/Skeleton';
import { getCatalogueLocalizer } from '@/i18n/catalogue';
import { Link } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { fmt } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import { alternates, getI18n } from '@/i18n/server';
import { getCategories } from '@/lib/server-api';

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<SearchParams> };

async function findCategory(slug: string, locale: Locale, m: Messages) {
  const [raw, l10n] = await Promise.all([getCategories(), getCatalogueLocalizer(locale, m)]);
  const categories = l10n.categories(raw);
  return { category: categories.find((c) => c.slug === slug), categories };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  const { category } = await findCategory((await params).slug, locale, m);
  if (!category) return { title: m.meta.categoryNotFound };
  const intro = m.listing.intros[category.slug] ?? fmt(m.meta.categoryFallbackIntro, { name: category.name.toLowerCase() });
  return {
    title: fmt(m.meta.categoryTitle, { name: category.name }),
    description: fmt(m.meta.categoryDescription, { name: category.name, intro }),
    alternates: alternates(locale, `/categorie/${category.slug}`),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ locale, m }, { slug }, query] = await Promise.all([getI18n(params), params, searchParams]);
  const { category, categories } = await findCategory(slug, locale, m);
  if (!category) notFound();
  const parent = category.parentId ? categories.find((c) => c.id === category.parentId) : undefined;
  const children = categories.filter((c) => c.parentId === category.id && c.productCount > 0);
  const crumbs = [...(parent ? [{ label: parent.name, href: `/categorie/${parent.slug}` }] : []), { label: category.name, href: `/categorie/${category.slug}` }];

  return (
    <div className="container py-10">
      <Breadcrumbs items={crumbs} locale={locale} m={m} />
      <h1 className="mt-4 text-3xl sm:text-4xl">{category.name}</h1>
      <p className="mt-2 max-w-2xl text-muted">{m.listing.intros[category.slug] ?? (locale === 'fr' ? category.description : null) ?? ''}</p>
      {children.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label={m.listing.subcategories}>
          {children.map((c) => (
            <li key={c.id}>
              <Link href={`/categorie/${c.slug}`} className="inline-flex min-h-[40px] items-center rounded-full border border-line px-4 text-sm font-semibold text-marine hover:border-deep hover:text-deep">
                {c.name} <span className="ml-2 text-muted">({c.productCount})</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        {category.productCount === 0 ? (
          <p className="rounded-lg bg-snow p-8 text-center font-semibold text-marine">{m.listing.comingSoon}</p>
        ) : (
          <Suspense fallback={<CatalogueBodySkeleton label={m.listing.loadingProducts} />}>
            <CatalogueView basePath={`/categorie/${category.slug}`} params={pickParams(query, { category: category.slug })} fixedCategory={category.slug} locale={locale} m={m} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
