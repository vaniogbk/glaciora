'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useI18n } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { sizeLabel } from '@/i18n/labels';
import type { Category, ProductList } from '@/lib/types';

const SORTS = ['featured', 'price_asc', 'price_desc', 'newest', 'name'] as const;

interface FiltersProps {
  facets: ProductList['facets'];
  categories: Category[];
  /** Masque le filtre catégorie sur une page catégorie. */
  fixedCategory?: string;
}

/** Filtres pilotés par l'URL (partageables, indexables, utilisables sans JS via le bouton Appliquer). */
export function Filters({ facets, categories, fixedCategory }: FiltersProps) {
  const { m } = useI18n();
  const t = m.filters;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  // Filtre en cours d'application tant que l'URL n'a pas rejoint la recherche demandée. Pas de startTransition autour de
  // router.push : Next le fait déjà, et l'imbrication bloque la navigation si un filtre change pendant l'arrivée sur la page.
  const [targetQuery, setTargetQuery] = useState<string | null>(null);
  const pending = targetQuery !== null && targetQuery !== params.toString();

  function apply(next: URLSearchParams) {
    next.delete('page');
    for (const [key, value] of [...next.entries()]) if (!value) next.delete(key);
    setTargetQuery(next.toString());
    router.push(`${pathname}${next.toString() ? `?${next}` : ''}`, { scroll: false });
  }

  function onChange(e: FormEvent<HTMLFormElement>, submitted = false) {
    // Les champs de prix ne déclenchent la recherche qu'à la validation (pas à chaque frappe).
    if (!submitted && (e.target as HTMLInputElement).type === 'number') return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const next = new URLSearchParams();
    for (const [key, value] of data.entries()) if (typeof value === 'string' && value) next.set(key, value);
    if (params.get('q')) next.set('q', params.get('q')!);
    apply(next);
  }

  const roots = categories.filter((c) => !c.parentId && c.productCount > 0);
  const children = (id: string) => categories.filter((c) => c.parentId === id && c.productCount > 0);

  return (
    <form
      onChange={onChange}
      onSubmit={(e) => {
        e.preventDefault();
        onChange(e, true);
      }}
      aria-label={t.form}
      className="space-y-6"
      data-pending={pending || undefined}
    >
      <div>
        <label htmlFor="tri" className="field-label">
          {t.sortBy}
        </label>
        <select id="tri" name="sort" defaultValue={params.get('sort') ?? 'featured'} className="field-input">
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {t.sorts[s]}
            </option>
          ))}
        </select>
      </div>

      {!fixedCategory && roots.length > 0 && (
        <div>
          <label htmlFor="filtre-categorie" className="field-label">
            {t.category}
          </label>
          <select id="filtre-categorie" name="category" defaultValue={params.get('category') ?? ''} className="field-input">
            <option value="">{t.allCategories}</option>
            {roots.map((root) => (
              <optgroup key={root.id} label={root.name}>
                <option value={root.slug}>{fmt(t.allOf, { name: root.name })}</option>
                {children(root.id).map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

      <fieldset>
        <legend className="field-label">{t.sport}</legend>
        <div className="mt-1 flex gap-4 text-sm">
          {[
            ['', t.all],
            ['SKI', t.ski],
            ['HOCKEY', t.hockey],
          ].map(([value, label]) => (
            <label key={value} className="inline-flex min-h-[44px] items-center gap-2">
              <input type="radio" name="sport" value={value} defaultChecked={(params.get('sport') ?? '') === value} className="h-4 w-4 accent-deep" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {facets.sizes.length > 0 && (
        <div>
          <label htmlFor="filtre-taille" className="field-label">
            {t.size}
          </label>
          <select id="filtre-taille" name="size" defaultValue={params.get('size') ?? ''} className="field-input">
            <option value="">{t.allSizes}</option>
            {facets.sizes.map((s) => (
              <option key={s} value={s}>
                {sizeLabel(s, m.productClient.sizeWords)}
              </option>
            ))}
          </select>
        </div>
      )}

      {facets.brands.length > 0 && (
        <div>
          <label htmlFor="filtre-marque" className="field-label">
            {t.brand}
          </label>
          <select id="filtre-marque" name="brand" defaultValue={params.get('brand') ?? ''} className="field-input">
            <option value="">{t.allBrands}</option>
            {facets.brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}

      <fieldset>
        <legend className="field-label">{t.price}</legend>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="prix-min" className="sr-only">
              {t.minPrice}
            </label>
            <input id="prix-min" name="minPrice" type="number" min={0} inputMode="numeric" placeholder={facets.price ? `${t.min} ${facets.price.min}` : t.min} defaultValue={params.get('minPrice') ?? ''} className="field-input" />
          </div>
          <div>
            <label htmlFor="prix-max" className="sr-only">
              {t.maxPrice}
            </label>
            <input id="prix-max" name="maxPrice" type="number" min={0} inputMode="numeric" placeholder={facets.price ? `${t.max} ${facets.price.max}` : t.max} defaultValue={params.get('maxPrice') ?? ''} className="field-input" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="field-label">{t.condition}</legend>
        <div className="mt-1 flex flex-wrap gap-4 text-sm">
          {[
            ['', t.all],
            ['NEW', t.new],
            ['USED', t.used],
          ].map(([value, label]) => (
            <label key={value} className="inline-flex min-h-[44px] items-center gap-2">
              <input type="radio" name="condition" value={value} defaultChecked={(params.get('condition') ?? '') === value} className="h-4 w-4 accent-deep" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-marine">
        <input type="checkbox" name="inStock" value="true" defaultChecked={params.get('inStock') === 'true'} className="h-4 w-4 accent-deep" />
        {t.inStock}
      </label>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1">
          {t.apply}
        </button>
        <button type="button" className="btn-outline" onClick={() => {
            setTargetQuery('');
            router.push(pathname, { scroll: false });
          }}>
          {t.clear}
        </button>
      </div>
    </form>
  );
}
