import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProductGallery } from '@/components/product/ProductGallery';
import { AddToCart } from '@/components/product/AddToCart';
import { ColorSelectionProvider } from '@/components/product/ColorSelection';
import { variantColors } from '@/components/product/color-swatch';
import { Price } from '@/components/product/Price';
import { ProductGrid } from '@/components/product/ProductGrid';
import { JsonLd } from '@/components/seo/JsonLd';
import { getCatalogueLocalizer } from '@/i18n/catalogue';
import { intlLocale, localizePath, type Locale } from '@/i18n/config';
import { fmt } from '@/i18n/format';
import { colorLabel } from '@/i18n/labels';
import type { Messages } from '@/i18n/messages';
import { alternates, getI18n } from '@/i18n/server';
import { getProduct } from '@/lib/server-api';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

// Aucune fiche générée au build : chacune est rendue à la première visite (dans chaque langue) puis servie depuis le cache
// (régénérée toutes les 60 s). Sans cette déclaration, Next recalcule la fiche à chaque visite.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ locale: string; slug: string }> };

async function load(slug: string, locale: Locale, m: Messages) {
  const [product, l10n] = await Promise.all([getProduct(slug), getCatalogueLocalizer(locale, m)]);
  return product ? l10n.detail(product) : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, m } = await getI18n(params);
  const product = await load((await params).slug, locale, m);
  if (!product) return { title: m.meta.productNotFound, robots: { index: false } };
  const title = `${product.brand} ${product.name}`;
  const description = (product.shortDescription ?? fmt(m.meta.productFallbackDescription, { title, category: product.category.name, sport: m.product.sports[product.sport].toLowerCase() })).slice(0, 155);
  const image = product.images[0];
  const path = `/produit/${product.slug}`;
  return {
    title: fmt(m.meta.productTitle, { title, category: product.category.name }),
    description,
    alternates: alternates(locale, path),
    openGraph: { type: 'website', title, description, url: localizePath(locale, path), images: image ? [{ url: image.url, alt: image.alt }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image.url] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, m } = await getI18n(params);
  const product = await load((await params).slug, locale, m);
  if (!product) notFound();
  const p = m.product;

  const crumbs = [
    ...(product.category.parent ? [{ label: product.category.parent.name, href: `/categorie/${product.category.parent.slug}` }] : []),
    { label: product.category.name, href: `/categorie/${product.category.slug}` },
    { label: product.name, href: `/produit/${product.slug}` },
  ];
  const specs = Object.entries(product.specs ?? {});
  const sizes = product.variants.map((v) => v.size?.label).filter(Boolean);
  const prices = product.variants.map((v) => v.priceCents).filter((c) => c > 0);
  const url = absoluteUrl(localizePath(locale, `/produit/${product.slug}`));

  // Données structurées : uniquement des valeurs réelles (prix et stock issus de la base).
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.name}`,
    sku: product.reference,
    brand: { '@type': 'Brand', name: product.brand },
    category: product.category.name,
    url,
    image: product.images.map((i) => absoluteUrl(i.url)),
    itemCondition: product.condition === 'USED' ? 'https://schema.org/UsedCondition' : 'https://schema.org/NewCondition',
    ...(product.shortDescription ? { description: product.shortDescription } : {}),
  };
  if (prices.length > 0) {
    jsonLd.offers = {
      '@type': prices.length > 1 && new Set(prices).size > 1 ? 'AggregateOffer' : 'Offer',
      priceCurrency: product.currency,
      ...(new Set(prices).size > 1 ? { lowPrice: (Math.min(...prices) / 100).toFixed(2), highPrice: (Math.max(...prices) / 100).toFixed(2) } : { price: (prices[0]! / 100).toFixed(2) }),
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url,
      seller: { '@type': 'Organization', name: 'GLACIORA' },
    };
  }

  return (
    <div className="container py-10">
      <Breadcrumbs items={crumbs} locale={locale} m={m} />
      <ColorSelectionProvider initial={variantColors(product.variants)[0] ?? null}>
      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />
        <div>
          <p className="eyebrow">{product.brand}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {p.reference} <span className="font-semibold text-marine">{product.reference}</span>
            {' · '}
            {product.condition === 'USED' ? p.used : p.new}
            {' · '}
            {p.sports[product.sport]}
          </p>
          <div className="mt-5">
            <Price cents={product.priceFromCents} compareAtCents={product.compareAtPriceCents} from={new Set(prices).size > 1} size="lg" locale={locale} labels={m.price} />
            <p className={product.inStock ? 'mt-2 text-sm font-semibold text-success' : 'mt-2 text-sm font-semibold text-muted'}>
              {product.inStock ? p.inStockShipping : p.outOfStock}
            </p>
          </div>
          {product.shortDescription && <p className="mt-6 text-base leading-relaxed text-ink">{product.shortDescription}</p>}
          <div className="mt-8">
            <AddToCart variants={product.variants} productName={product.name} />
          </div>
          <div className="mt-8 space-y-3 rounded-lg bg-snow p-5 text-sm">
            <h2 className="text-base font-bold">{p.deliveryTitle}</h2>
            <p>{p.deliveryText}</p>
            <p>{p.paymentText}</p>
          </div>
        </div>
      </div>
      </ColorSelectionProvider>

      <section className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2" aria-labelledby="caracteristiques">
        <div>
          <h2 id="caracteristiques" className="text-2xl">
            {p.specs}
          </h2>
          <dl className="mt-4 divide-y divide-line rounded-lg border border-line">
            <div className="grid grid-cols-2 gap-4 p-3 text-sm">
              <dt className="font-semibold text-marine">{p.brand}</dt>
              <dd>{product.brand}</dd>
            </div>
            {product.model && (
              <div className="grid grid-cols-2 gap-4 p-3 text-sm">
                <dt className="font-semibold text-marine">{p.model}</dt>
                <dd>{product.model}</dd>
              </div>
            )}
            {sizes.length > 0 && (
              <div className="grid grid-cols-2 gap-4 p-3 text-sm">
                <dt className="font-semibold text-marine">{p.sizes}</dt>
                <dd>{sizes.join(' · ')}</dd>
              </div>
            )}
            {product.colors.length > 0 && (
              <div className="grid grid-cols-2 gap-4 p-3 text-sm">
                <dt className="font-semibold text-marine">{p.colors}</dt>
                <dd>{product.colors.map((c) => colorLabel(c, m.colors)).join(', ')}</dd>
              </div>
            )}
            {specs.map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-4 p-3 text-sm">
                <dt className="font-semibold text-marine">{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            {product.weightGrams && (
              <div className="grid grid-cols-2 gap-4 p-3 text-sm">
                <dt className="font-semibold text-marine">{p.weight}</dt>
                <dd>{(product.weightGrams / 1000).toLocaleString(intlLocale(locale))} kg</dd>
              </div>
            )}
            {product.dimensions && (
              <div className="grid grid-cols-2 gap-4 p-3 text-sm">
                <dt className="font-semibold text-marine">{p.dimensions}</dt>
                <dd>{product.dimensions}</dd>
              </div>
            )}
          </dl>
        </div>
        {product.description && locale === 'fr' && (
          <div>
            <h2 className="text-2xl">{p.description}</h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed">{product.description}</div>
          </div>
        )}
      </section>

      {product.related.length > 0 && (
        <section className="mt-16" aria-labelledby="similaires">
          <h2 id="similaires" className="mb-6 text-2xl">
            {p.related}
          </h2>
          <ProductGrid products={product.related} locale={locale} m={m} />
        </section>
      )}
      <JsonLd data={jsonLd} />
    </div>
  );
}
