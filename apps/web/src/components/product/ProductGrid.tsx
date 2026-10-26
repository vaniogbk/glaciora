import type { ProductCard as ProductCardData } from '@/lib/types';
import { Reveal } from '@/components/ui/Reveal';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products, columns = 4 }: { products: ProductCardData[]; columns?: 3 | 4 }) {
  return (
    <ul className={columns === 4 ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6' : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6'}>
      {products.map((product, index) => (
        <li key={product.id}>
          <Reveal delay={Math.min(index, 8) * 60} className="h-full">
            <ProductCard product={product} priority={index < 2} />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
