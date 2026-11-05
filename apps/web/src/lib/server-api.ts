import type { Category, ProductCard, ProductDetail, ProductList } from './types';

const API_URL = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/** Au-delà, la page s'affiche sans ces données (message « momentanément indisponible ») plutôt que de rester bloquée. */
const API_TIMEOUT_MS = 8000;

/**
 * Lecture côté serveur (Server Components) avec cache ISR. Ne lève jamais : renvoie null si l'API ne répond pas
 * ou dépasse API_TIMEOUT_MS. Délai appliqué par course plutôt que par AbortSignal, pour ne pas toucher au cache de fetch.
 */
async function get<T>(path: string, revalidate = 60): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), API_TIMEOUT_MS);
  });
  const request = (async () => {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (process.env.PROXY_SECRET) headers['x-glaciora-proxy'] = process.env.PROXY_SECRET;
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate }, headers });
    if (!res.ok) return null;
    return (await res.json()) as T;
  })().catch(() => null);
  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export async function getCategories(): Promise<Category[]> {
  return (await get<{ categories: Category[] }>('/api/catalogue/categories', 120))?.categories ?? [];
}

export async function getProducts(params: Record<string, string | undefined>): Promise<ProductList | null> {
  const qs = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1]))).toString();
  return get<ProductList>(`/api/catalogue/products${qs ? `?${qs}` : ''}`, 30);
}

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  return (await get<{ product: ProductDetail }>(`/api/catalogue/products/${encodeURIComponent(slug)}`, 30))?.product ?? null;
}

export interface HomeData {
  featured: ProductCard[];
  ski: ProductCard[];
  hockey: ProductCard[];
  accessories: ProductCard[];
  newest: ProductCard[];
}

export async function getHome(): Promise<HomeData> {
  return (await get<HomeData>('/api/catalogue/home', 60)) ?? { featured: [], ski: [], hockey: [], accessories: [], newest: [] };
}

export async function getSitemapEntries() {
  return (
    (await get<{ products: { slug: string; updatedAt: string }[]; categories: { slug: string; updatedAt: string }[] }>('/api/catalogue/sitemap', 3600)) ?? {
      products: [],
      categories: [],
    }
  );
}
