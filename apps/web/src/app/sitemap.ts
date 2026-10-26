import type { MetadataRoute } from 'next';
import { getSitemapEntries } from '@/lib/server-api';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getSitemapEntries();
  return [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/catalogue'), changeFrequency: 'daily', priority: 0.9 },
    ...categories.map((c) => ({ url: absoluteUrl(`/categorie/${c.slug}`), lastModified: new Date(c.updatedAt), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...products.map((p) => ({ url: absoluteUrl(`/produit/${p.slug}`), lastModified: new Date(p.updatedAt), changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
}
