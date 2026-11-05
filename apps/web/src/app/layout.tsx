import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE_NAME, SITE_URL } from '@/lib/site';

/**
 * Racine commune : la balise <html> (et sa langue) est posée par app/[locale]/layout.tsx pour la boutique
 * et par app/admin/layout.tsx pour l'administration.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: '#0A1A2F', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
