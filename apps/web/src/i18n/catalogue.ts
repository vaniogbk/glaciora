import type { Category, ProductCard, ProductDetail, ProductList } from '@/lib/types';
import type { Locale } from './config';
import { sizeLabel } from './labels';
import type { Messages } from './messages';

/**
 * Traduction des textes du catalogue (saisis en français dans l'admin) : noms de catégories, descriptions courtes,
 * caractéristiques. Un produit ajouté depuis sans traduction s'affiche avec son texte français.
 */
export interface CatalogueTranslation {
  /** Nom de catégorie, par identifiant d'URL (slug). */
  categories: Record<string, string>;
  /** Description courte, par slug de produit. */
  products: Record<string, string>;
  /** Noms des caractéristiques (clé française → traduction). */
  specKeys: Record<string, string>;
  /** Valeurs textuelles des caractéristiques (valeur française → traduction) ; les mesures restent telles quelles. */
  specValues: Record<string, string>;
}

const loaders: Record<Exclude<Locale, 'fr'>, () => Promise<{ default: CatalogueTranslation }>> = {
  de: () => import('./catalogue/de'),
  en: () => import('./catalogue/en'),
  es: () => import('./catalogue/es'),
  it: () => import('./catalogue/it'),
  nl: () => import('./catalogue/nl'),
  pt: () => import('./catalogue/pt'),
  pl: () => import('./catalogue/pl'),
  cs: () => import('./catalogue/cs'),
  sk: () => import('./catalogue/sk'),
  sl: () => import('./catalogue/sl'),
  et: () => import('./catalogue/et'),
  lt: () => import('./catalogue/lt'),
  fi: () => import('./catalogue/fi'),
  sv: () => import('./catalogue/sv'),
  nb: () => import('./catalogue/nb'),
  is: () => import('./catalogue/is'),
  ro: () => import('./catalogue/ro'),
};

export interface CatalogueLocalizer {
  category: (slug: string, name: string) => string;
  card: (card: ProductCard) => ProductCard;
  detail: (product: ProductDetail) => ProductDetail;
  list: (list: ProductList) => ProductList;
  categories: (categories: Category[]) => Category[];
  spec: (key: string, value: string) => [string, string];
}

/** Texte alternatif des photos généré à l'import (« Zag Slap 92 coloris Purple », « … — autre coloris »). */
function altText(alt: string, m: Messages): string {
  return alt.replace(' — autre coloris', ` — ${m.productClient.otherColor}`).replace(' coloris ', ` ${m.productClient.colorWord} `);
}

export async function getCatalogueLocalizer(locale: Locale, m: Messages): Promise<CatalogueLocalizer> {
  const t: CatalogueTranslation | null = locale === 'fr' ? null : (await loaders[locale]()).default;
  const words = m.productClient.sizeWords;
  const category = (slug: string, name: string) => t?.categories[slug] ?? name;
  const card = (c: ProductCard): ProductCard =>
    t
      ? { ...c, category: { ...c.category, name: category(c.category.slug, c.category.name) }, sizes: c.sizes.map((s) => sizeLabel(s, words)), image: c.image ? { ...c.image, alt: altText(c.image.alt, m) } : null }
      : c;
  const spec = (key: string, value: string): [string, string] => (t ? [t.specKeys[key] ?? key, t.specValues[value] ?? value] : [key, value]);
  return {
    category,
    card,
    spec,
    categories: (list) => (t ? list.map((c) => ({ ...c, name: category(c.slug, c.name) })) : list),
    list: (list) => (t ? { ...list, items: list.items.map(card) } : list),
    detail: (p) => {
      const variants = p.variants.map((v) => (v.size ? { ...v, size: { ...v.size, label: sizeLabel(v.size.label, words) } } : v));
      if (!t) return { ...p, variants };
      return {
        ...p,
        shortDescription: t.products[p.slug] ?? p.shortDescription,
        category: {
          ...p.category,
          name: category(p.category.slug, p.category.name),
          parent: p.category.parent ? { ...p.category.parent, name: category(p.category.parent.slug, p.category.parent.name) } : null,
        },
        specs: p.specs ? Object.fromEntries(Object.entries(p.specs).map(([k, v]) => spec(k, v))) : null,
        images: p.images.map((i) => ({ ...i, alt: altText(i.alt, m) })),
        variants,
        related: p.related.map(card),
      };
    },
  };
}
