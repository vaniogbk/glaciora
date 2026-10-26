import type { Prisma } from '@prisma/client';
import type { ProductQuery } from '@glaciora/shared';
import { prisma } from '../../lib/prisma';

export const productCardSelect = {
  id: true,
  reference: true,
  slug: true,
  name: true,
  brand: true,
  sport: true,
  condition: true,
  priceFromCents: true,
  compareAtPriceCents: true,
  currency: true,
  isNew: true,
  isFeatured: true,
  imagesAreIllustrations: true,
  category: { select: { slug: true, name: true } },
  images: { select: { url: true, alt: true, width: true, height: true }, orderBy: { position: 'asc' }, take: 1 },
  variants: {
    where: { isActive: true },
    select: { priceCents: true, stock: { select: { quantity: true } }, size: { select: { label: true } } },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardRow = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export async function categoryIdsWithDescendants(slug: string): Promise<string[]> {
  const all = await prisma.category.findMany({ select: { id: true, slug: true, parentId: true } });
  const root = all.find((c) => c.slug === slug);
  if (!root) return [];
  const ids = [root.id];
  for (let i = 0; i < ids.length; i++) {
    for (const c of all) if (c.parentId === ids[i]) ids.push(c.id);
  }
  return ids;
}

export function buildProductWhere(query: ProductQuery, categoryIds?: string[]): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ status: 'ACTIVE' }];
  if (categoryIds) and.push({ categoryId: { in: categoryIds } });
  if (query.sport) and.push({ sport: query.sport });
  if (query.brand) and.push({ brand: { equals: query.brand, mode: 'insensitive' } });
  if (query.condition) and.push({ condition: query.condition });
  if (query.minPrice != null) and.push({ priceFromCents: { gte: query.minPrice * 100 } });
  if (query.maxPrice != null) and.push({ priceFromCents: { lte: query.maxPrice * 100 } });
  if (query.size) and.push({ variants: { some: { isActive: true, size: { label: query.size } } } });
  if (query.inStock === 'true') and.push({ variants: { some: { isActive: true, stock: { quantity: { gt: 0 } } } } });
  if (query.q) {
    const terms = query.q.split(/\s+/).filter(Boolean).slice(0, 6);
    for (const term of terms) {
      and.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
          { model: { contains: term, mode: 'insensitive' } },
          { reference: { contains: term, mode: 'insensitive' } },
          { shortDescription: { contains: term, mode: 'insensitive' } },
          { category: { name: { contains: term, mode: 'insensitive' } } },
        ],
      });
    }
  }
  return { AND: and };
}

export function buildOrderBy(sort: ProductQuery['sort']): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ priceFromCents: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }];
    case 'price_desc':
      return [{ priceFromCents: { sort: 'desc', nulls: 'last' } }, { name: 'asc' }];
    case 'newest':
      return [{ createdAt: 'desc' }];
    case 'name':
      return [{ name: 'asc' }];
    default:
      return [{ isFeatured: 'desc' }, { isNew: 'desc' }, { name: 'asc' }];
  }
}
