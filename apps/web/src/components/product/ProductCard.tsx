import Image from 'next/image';
import { Link } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import type { Messages } from '@/i18n/messages';
import type { ProductCard as ProductCardData } from '@/lib/types';
import { Price } from './Price';

export function ProductCard({ product, priority = false, locale, m }: { product: ProductCardData; priority?: boolean; locale: Locale; m: Messages }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-square bg-snow">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
            className="object-contain p-4 transition duration-500 group-hover:scale-[1.04]"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">{m.card.visualSoon}</div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.isNew && <span className="rounded-sm bg-marine px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">{m.card.new}</span>}
          {product.condition === 'USED' && <span className="rounded-sm bg-white px-2 py-0.5 text-xs font-bold uppercase text-marine">{m.card.used}</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="eyebrow">{product.brand}</p>
        <h3 className="text-base font-bold leading-snug text-marine">
          <Link href={`/produit/${product.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto space-y-1">
          <Price cents={product.priceFromCents} compareAtCents={product.compareAtPriceCents} from={product.hasPriceRange} locale={locale} labels={m.price} />
          <p className={product.inStock ? 'text-xs font-semibold text-success' : 'text-xs font-semibold text-muted'}>
            {product.inStock ? m.card.inStock : m.card.outOfStock}
          </p>
        </div>
      </div>
    </article>
  );
}
