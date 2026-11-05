import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { BRAND } from '@glaciora/shared/contact';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartProvider } from '@/components/providers/CartProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { JsonLd } from '@/components/seo/JsonLd';
import { I18nProvider } from '@/i18n/client';
import { LOCALES, ogLocale } from '@/i18n/config';
import { CLIENT_NAMESPACES, pick } from '@/i18n/messages';
import { getI18n } from '@/i18n/server';
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/site';
import { fontVariables } from '../fonts';

/**
 * Une version statique par langue. Pas de « dynamicParams = false » ici : il s'appliquerait aussi aux fiches produit
 * générées à la demande (404). Une langue inconnue n'arrive jamais jusqu'ici (middleware) et getI18n renvoie une 404.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  return {
    title: { default: m.meta.siteTitle, template: `%s | ${SITE_NAME}` },
    description: m.meta.defaultDescription,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      url: SITE_URL,
      title: m.meta.ogTitle,
      description: m.meta.defaultDescription,
      images: [{ url: '/brand/og-default.png', width: 1200, height: 630, alt: m.meta.ogImageAlt }],
    },
    twitter: { card: 'summary_large_image', title: SITE_NAME, description: m.meta.defaultDescription, images: ['/brand/og-default.png'] },
  };
}

const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl('/brand/icone-app-1024.png'),
  email: BRAND.email,
  telephone: BRAND.phoneE164,
  slogan: BRAND.tagline,
  address: { '@type': 'PostalAddress', streetAddress: BRAND.streetAddress, postalCode: BRAND.postalCode, addressLocality: BRAND.addressLocality, addressRegion: BRAND.addressRegion, addressCountry: BRAND.addressCountry },
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale, m } = await getI18n(params);
  return (
    <html lang={locale} className={fontVariables}>
      <body className="flex min-h-screen flex-col">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift">
          {m.common.skipToContent}
        </a>
        <I18nProvider locale={locale} messages={pick(m, CLIENT_NAMESPACES)}>
          <AuthProvider>
            <CartProvider>
              <Header />
              <main id="contenu" className="flex-1">
                {children}
              </main>
              <Footer locale={locale} m={m} />
            </CartProvider>
          </AuthProvider>
        </I18nProvider>
        <JsonLd data={organization} />
        {/* Core Web Vitals des vrais visiteurs (Vercel Speed Insights : sans cookie, actif seulement en production Vercel). */}
        <SpeedInsights />
      </body>
    </html>
  );
}
