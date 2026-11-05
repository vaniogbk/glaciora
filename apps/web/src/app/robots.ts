import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Pages privées ou sans intérêt pour les moteurs, en français (sans préfixe) et dans les autres langues (/de/compte…).
        disallow: ['/admin', '/api/', '/compte', '/panier', '/commande', '/recherche', '/*/compte', '/*/panier', '/*/commande', '/*/recherche'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
