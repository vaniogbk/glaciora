/** @type {import('next').NextConfig} */
const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

// CSP : tout vient du site lui-même (police, images, Speed Insights sous /_vercel). « unsafe-inline » reste nécessaire aux
// scripts d'amorçage de Next sans nonce ; « unsafe-eval » seulement en développement (rechargement à chaud).
const isDev = process.env.NODE_ENV !== 'production';
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    // Variantes optimisées gardées 30 jours (les sources /media ont une empreinte dans leur nom).
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // En production, les adresses *.vercel.app (ancienne adresse du projet, supprimée) renvoient vers le domaine du site : l'API n'accepte
  // que ses origines (WEB_ORIGIN), donc connexion, admin et commande y échouaient (« Origine non autorisée »).
  // Les déploiements de prévisualisation (VERCEL_ENV=preview) ne sont pas concernés.
  async redirects() {
    if (process.env.VERCEL_ENV !== 'production' || !process.env.NEXT_PUBLIC_SITE_URL) return [];
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: '(?<vercelHost>.+)\\.vercel\\.app' }],
        destination: `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/:path*`,
        permanent: true,
      },
    ];
  },
  // L'API Railway est servie sous le même domaine que le site : cookies first-party, pas de CORS.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      // Photos produit et visuels d'accueil : nom avec empreinte du contenu (import), donc immuables.
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      // Logos et icônes : noms fixes, cache court avec revalidation en arrière-plan.
      { source: '/brand/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    ];
  },
};

export default nextConfig;
