'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition, type FormEvent } from 'react';
import type { Category, ProductList } from '@/lib/types';

const SORTS = [
  { value: 'featured', label: 'Recommandés' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'name', label: 'Nom (A-Z)' },
];

interface FiltersProps {
  facets: ProductList['facets'];
  categories: Category[];
  /** Masque le filtre catégorie sur une page catégorie. */
  fixedCategory?: string;
}

/** Filtres pilotés par l'URL (partageables, indexables, utilisables sans JS via le bouton Appliquer). */
export function Filters({ facets, categories, fixedCategory }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(next: URLSearchParams) {
    next.delete('page');
    for (const [key, value] of [...next.entries()]) if (!value) next.delete(key);
    startTransition(() => router.push(`${pathname}${next.toString() ? `?${next}` : ''}`, { scroll: false }));
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
      aria-label="Filtrer les produits"
      className="space-y-6"
      data-pending={pending || undefined}
    >
      <div>
        <label htmlFor="tri" className="field-label">
          Trier par
        </label>
        <select id="tri" name="sort" defaultValue={params.get('sort') ?? 'featured'} className="field-input">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {!fixedCategory && roots.length > 0 && (
        <div>
          <label htmlFor="filtre-categorie" className="field-label">
            Catégorie
          </label>
          <select id="filtre-categorie" name="category" defaultValue={params.get('category') ?? ''} className="field-input">
            <option value="">Toutes</option>
            {roots.map((root) => (
              <optgroup key={root.id} label={root.name}>
                <option value={root.slug}>Tout {root.name.toLowerCase()}</option>
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
        <legend className="field-label">Sport</legend>
        <div className="mt-1 flex gap-4 text-sm">
          {[
            ['', 'Tous'],
            ['SKI', 'Ski'],
            ['HOCKEY', 'Hockey'],
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
            Taille
          </label>
          <select id="filtre-taille" name="size" defaultValue={params.get('size') ?? ''} className="field-input">
            <option value="">Toutes les tailles</option>
            {facets.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {facets.brands.length > 0 && (
        <div>
          <label htmlFor="filtre-marque" className="field-label">
            Marque
          </label>
          <select id="filtre-marque" name="brand" defaultValue={params.get('brand') ?? ''} className="field-input">
            <option value="">Toutes les marques</option>
            {facets.brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}

      <fieldset>
        <legend className="field-label">Prix (€)</legend>
        <div className="mt-1 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="prix-min" className="sr-only">
              Prix minimum
            </label>
            <input id="prix-min" name="minPrice" type="number" min={0} inputMode="numeric" placeholder={facets.price ? `Min ${facets.price.min}` : 'Min'} defaultValue={params.get('minPrice') ?? ''} className="field-input" />
          </div>
          <div>
            <label htmlFor="prix-max" className="sr-only">
              Prix maximum
            </label>
            <input id="prix-max" name="maxPrice" type="number" min={0} inputMode="numeric" placeholder={facets.price ? `Max ${facets.price.max}` : 'Max'} defaultValue={params.get('maxPrice') ?? ''} className="field-input" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="field-label">État</legend>
        <div className="mt-1 flex flex-wrap gap-4 text-sm">
          {[
            ['', 'Tous'],
            ['NEW', 'Neuf'],
            ['USED', 'Occasion'],
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
        Disponible uniquement
      </label>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1">
          Appliquer
        </button>
        <button type="button" className="btn-outline" onClick={() => startTransition(() => router.push(pathname, { scroll: false }))}>
          Effacer
        </button>
      </div>
    </form>
  );
}
