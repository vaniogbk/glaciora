import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProductGallery } from '@/components/product/ProductGallery';
import { AddToCart } from '@/components/product/AddToCart';
import { Price } from '@/components/product/Price';
import { ProductGrid } from '@/components/product/ProductGrid';
import { JsonLd } from '@/components/seo/JsonLd';
import { getProduct } from '@/lib/server-api';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 60;

const SPORT_LABEL = { SKI: 'Ski', HOCKEY: 'Hockey sur glace' } as const;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: 'Produit introuvable', robots: { index: false } };
  const title = `${product.brand} ${product.name}`;
  const description = (product.shortDescription ?? `${title} — ${product.category.name}, ${SPORT_LABEL[product.sport].toLowerCase()}.`).slice(0, 155);
  const image = product.images[0];
  return {
    title: `${title} — ${product.category.name}`,
    description,
    alternates: { canonical: `/produit/${product.slug}` },
    openGraph: { type: 'website', title, description, url: `/produit/${product.slug}`, images: image ? [{ url: image.url, alt: image.alt }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image.url] : undefined },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const crumbs = [
    ...(product.category.parent ? [{ label: product.category.parent.name, href: `/categorie/${product.category.parent.slug}` }] : []),
    { label: product.category.name, href: `/categorie/${product.category.slug}` },
    { label: product.name, href: `/produit/${product.slug}` },
  ];
  const specs = Object.entries(product.specs ?? {});
  const sizes = product.variants.map((v) => v.size?.label).filter(Boolean);
  const prices = product.variants.map((v) => v.priceCents).filter((p) => p > 0);

  // Données structurées : uniquement des valeurs réelles (prix et stock issus de la base).
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${product.brand} ${product.name}`,
    sku: product.reference,
    brand: { '@type': 'Brand', name: product.brand },
    category: product.category.name,
    url: absoluteUrl(`/produit/${product.slug}`),
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
      url: absoluteUrl(`/produit/${product.slug}`),
      seller: { '@type': 'Organization', name: 'GLACIORA' },
    };
  }

  return (
    <div className="container py-10">
      <Breadcrumbs items={crumbs} />
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} isIllustration={product.imagesAreIllustrations} />
        <div>
          <p className="eyebrow">{product.brand}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">{product.name}</h1>
          <p className="mt-2 text-sm text-muted">
            Référence : <span className="font-semibold text-marine">{product.reference}</span>
            {' · '}
            {product.condition === 'USED' ? 'Occasion' : 'Neuf'}
            {' · '}
            {SPORT_LABEL[product.sport]}
          </p>
          <div className="mt-5">
            <Price cents={product.priceFromCents} compareAtCents={product.compareAtPriceCents} from={new Set(prices).size > 1} size="lg" />
            <p className={product.inStock ? 'mt-2 text-sm font-semibold text-success' : 'mt-2 text-sm font-semibold text-muted'}>
              {product.inStock ? 'En stock — expédition après vérification du virement' : 'Rupture de stock'}
            </p>
          </div>
          {product.shortDescription && <p className="mt-6 text-base leading-relaxed text-ink">{product.shortDescription}</p>}
          <div className="mt-8">
            <AddToCart variants={product.variants} productName={product.name} />
          </div>
          <div className="mt-8 space-y-3 rounded-lg bg-snow p-5 text-sm">
            <h2 className="text-base font-bold">Livraison et paiement</h2>
            <p>Livraison en Europe : les pays et frais disponibles s’affichent à l’étape de commande, selon votre adresse.</p>
            <p>Paiement par virement bancaire SEPA, avec QR code. Votre commande est préparée dès que le virement est vérifié.</p>
          </div>
        </div>
      </div>

      <section className="mt-14 grid gap-10 lg:grid-cols-2" aria-labelledby="caracteristiques">
        <div>
          <h2 id="caracteristiques" className="text-2xl">
            Caractéristiques
          </h2>
          <dl className="mt-4 divide-y divide-line rounded-lg border border-line">
            <div className="grid grid-cols-2 gap-4 p-3 text-sm">
              <dt className="font-semibold text-marine">Marque</dt>
              <dd>{product.brand}</dd>
            </div>
            {product.model && (
              <div className="grid grid-cols-2 gap-4 p-3 text-sm">
                <dt className="font-semibold text-marine">Modèle</dt>
                <dd>{product.model}</dd>
              </div>
            )}
            {sizes.length > 0 && (
              <div className="grid grid-cols-2 gap-4 p-3 text-sm">
                <dt className="font-semibold text-marine">Tailles</dt>
                <dd>{sizes.join(' · ')}</dd>
              </div>
            )}
            {product.colors.length > 0 && (
              <div className="grid grid-cols-2 gap-4 p-3 text-sm">
                <dt className="font-semibold text-marine">Coloris</dt>
                <dd>{product.colors.join(', ')}</dd>
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
                <dt className="font-semibold text-marine">Poids</dt>
                <dd>{(product.weightGrams / 1000).toLocaleString('fr-FR')} kg</dd>
              </div>
            )}
            {product.dimensions && (
              <div className="grid grid-cols-2 gap-4 p-3 text-sm">
                <dt className="font-semibold text-marine">Dimensions</dt>
                <dd>{product.dimensions}</dd>
              </div>
            )}
          </dl>
        </div>
        {product.description && (
          <div>
            <h2 className="text-2xl">Description</h2>
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed">{product.description}</div>
          </div>
        )}
      </section>

      {product.related.length > 0 && (
        <section className="mt-16" aria-labelledby="similaires">
          <h2 id="similaires" className="mb-6 text-2xl">
            Produits similaires
          </h2>
          <ProductGrid products={product.related} />
        </section>
      )}
      <JsonLd data={jsonLd} />
    </div>
  );
}
