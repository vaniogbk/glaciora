import { Suspense } from 'react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getCatalogueLocalizer } from '@/i18n/catalogue';
import { Link } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { plural } from '@/i18n/format';
import type { Messages } from '@/i18n/messages';
import { getCategories, getProducts } from '@/lib/server-api';
import { Filters } from './Filters';
import { FiltersPanel } from './FiltersPanel';

export type SearchParams = Record<string, string | string[] | undefined>;

const FILTER_KEYS = ['category', 'sport', 'size', 'brand', 'condition', 'inStock', 'minPrice', 'maxPrice'];
const ALLOWED = ['q', 'category', 'sport', 'size', 'brand', 'condition', 'inStock', 'minPrice', 'maxPrice', 'sort', 'page'];

export function pickParams(searchParams: SearchParams, overrides: Record<string, string> = {}) {
  const out: Record<string, string> = {};
  for (const key of ALLOWED) {
    const value = searchParams[key];
    const str = Array.isArray(value) ? value[0] : value;
    if (str) out[key] = str.slice(0, 100);
  }
  return { ...out, ...overrides };
}

function pageHref(base: string, params: Record<string, string>, page: number) {
  const qs = new URLSearchParams({ ...params, page: String(page) });
  if (page === 1) qs.delete('page');
  qs.delete('category');
  if (params.category && !base.startsWith('/categorie/')) qs.set('category', params.category);
  return `${base}${qs.toString() ? `?${qs}` : ''}`;
}

export async function CatalogueView({ basePath, params, fixedCategory, locale, m }: { basePath: string; params: Record<string, string>; fixedCategory?: string; locale: Locale; m: Messages }) {
  const [rawList, rawCategories, l10n] = await Promise.all([getProducts(params), getCategories(), getCatalogueLocalizer(locale, m)]);

  if (!rawList) {
    return (
      <p className="rounded-md bg-snow p-6 text-sm" role="alert">
        {m.listing.unavailable}
      </p>
    );
  }
  const list = l10n.list(rawList);
  const categories = l10n.categories(rawCategories);
  const l = m.listing;

  return (
    <div className="catalogue grid gap-4 lg:grid-cols-[260px_1fr] lg:gap-8">
      <aside aria-label={l.filtersAndSort}>
        <FiltersPanel total={list.total} active={FILTER_KEYS.filter((key) => params[key] && !(key === 'category' && fixedCategory)).length}>
          <Suspense>
            <Filters facets={list.facets} categories={categories} fixedCategory={fixedCategory} />
          </Suspense>
        </FiltersPanel>
      </aside>
      <section aria-labelledby="resultats" className="catalogue-results">
        <h2 id="resultats" className="sr-only">
          {l.results}
        </h2>
        <p className="mb-4 hidden text-sm text-muted lg:block" aria-live="polite">
          {plural(locale, list.total, l.productCount)}
        </p>
        {list.items.length === 0 ? (
          <div className="rounded-lg bg-snow p-8 text-center">
            <p className="font-semibold text-marine">{l.noResults}</p>
            <Link href={basePath} className="mt-3 inline-block text-sm font-semibold text-deep underline">
              {l.clearFilters}
            </Link>
          </div>
        ) : (
          <ProductGrid products={list.items} columns={3} priorityCount={2} locale={locale} m={m} />
        )}
        {list.totalPages > 1 && (
          <nav aria-label={l.pagination} className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {list.page > 1 && (
              <Link className="btn-outline" href={pageHref(basePath, params, list.page - 1)} rel="prev">
                {l.previous}
              </Link>
            )}
            {Array.from({ length: list.totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={pageHref(basePath, params, page)}
                aria-current={page === list.page ? 'page' : undefined}
                className={page === list.page ? 'btn bg-marine text-white' : 'btn border border-line text-marine hover:border-marine'}
              >
                {page}
              </Link>
            ))}
            {list.page < list.totalPages && (
              <Link className="btn-outline" href={pageHref(basePath, params, list.page + 1)} rel="next">
                {l.next}
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
