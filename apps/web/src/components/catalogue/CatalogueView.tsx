import Link from 'next/link';
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getCategories, getProducts } from '@/lib/server-api';
import { Filters } from './Filters';

export type SearchParams = Record<string, string | string[] | undefined>;

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

export async function CatalogueView({ basePath, params, fixedCategory }: { basePath: string; params: Record<string, string>; fixedCategory?: string }) {
  const [list, categories] = await Promise.all([getProducts(params), getCategories()]);

  if (!list) {
    return (
      <p className="rounded-md bg-snow p-6 text-sm" role="alert">
        Le catalogue est momentanément indisponible. Merci de réessayer dans quelques instants.
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside>
        <details className="group rounded-lg bg-snow p-4 lg:p-5" open>
          <summary className="cursor-pointer list-none text-sm font-bold uppercase tracking-brand text-marine lg:hidden">Filtres et tri</summary>
          <div className="mt-4 lg:mt-0">
            <Suspense>
              <Filters facets={list.facets} categories={categories} fixedCategory={fixedCategory} />
            </Suspense>
          </div>
        </details>
      </aside>
      <section aria-labelledby="resultats">
        <h2 id="resultats" className="sr-only">
          Résultats
        </h2>
        <p className="mb-4 text-sm text-muted" aria-live="polite">
          {list.total} produit{list.total > 1 ? 's' : ''}
        </p>
        {list.items.length === 0 ? (
          <div className="rounded-lg bg-snow p-8 text-center">
            <p className="font-semibold text-marine">Aucun produit ne correspond à ces critères.</p>
            <Link href={basePath} className="mt-3 inline-block text-sm font-semibold text-deep underline">
              Effacer les filtres
            </Link>
          </div>
        ) : (
          <ProductGrid products={list.items} columns={3} />
        )}
        {list.totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {list.page > 1 && (
              <Link className="btn-outline" href={pageHref(basePath, params, list.page - 1)} rel="prev">
                Précédent
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
                Suivant
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
