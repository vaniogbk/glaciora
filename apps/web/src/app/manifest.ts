import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GLACIORA — ski et hockey sur glace',
    short_name: 'GLACIORA',
    description: 'Équipement de ski, de hockey sur glace et de sports de neige.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A1A2F',
    theme_color: '#0A1A2F',
    lang: 'fr',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
