import type { Metadata, Viewport } from 'next';
import { BRAND } from '@glaciora/shared';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartProvider } from '@/components/providers/CartProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { JsonLd } from '@/components/seo/JsonLd';
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Équipement de ski, hockey sur glace et sports de neige`, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'fr_FR',
    url: SITE_URL,
    title: `${SITE_NAME} — Born for ice. Made for adventure.`,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: '/brand/og-default.png', width: 1200, height: 630, alt: 'GLACIORA — ski et hockey sur glace' }],
  },
  twitter: { card: 'summary_large_image', title: SITE_NAME, description: DEFAULT_DESCRIPTION, images: ['/brand/og-default.png'] },
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: '#0A1A2F', width: 'device-width', initialScale: 1 };

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl('/brand/icone-app-1024.png'),
  email: BRAND.email,
  telephone: BRAND.phoneE164,
  slogan: BRAND.tagline,
  address: { '@type': 'PostalAddress', postalCode: BRAND.postalCode, addressLocality: BRAND.addressLocality, addressRegion: BRAND.addressRegion, addressCountry: BRAND.addressCountry },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Montserrat (charte GLACIORA) chargée en CSS : next/font/google échouait au build Vercel. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" />
      </head>
      <body className="flex min-h-screen flex-col">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift">
          Aller au contenu
        </a>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main id="contenu" className="flex-1">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
        <JsonLd data={organization} />
      </body>
    </html>
  );
}
