import type { ProductQuery } from '@glaciora/shared';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';
import {
  buildOrderBy,
  buildProductWhere,
  categoryIdsWithDescendants,
  productCardSelect,
  type ProductCardRow,
} from './catalogue.repository';

/** Quantité maximale exposée publiquement (on n'affiche pas le stock exact au-delà). */
const PUBLIC_STOCK_CAP = 10;

export function toProductCard(p: ProductCardRow) {
  const totalStock = p.variants.reduce((sum, v) => sum + (v.stock?.quantity ?? 0), 0);
  const prices = p.variants.map((v) => v.priceCents).filter((c) => c > 0);
  const sizes = [...new Set(p.variants.map((v) => v.size?.label).filter((s): s is string => Boolean(s)))];
  return {
    id: p.id,
    reference: p.reference,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    sport: p.sport,
    condition: p.condition,
    category: p.category,
    currency: p.currency,
    priceFromCents: prices.length ? Math.min(...prices) : p.priceFromCents,
    hasPriceRange: new Set(prices).size > 1,
    compareAtPriceCents: p.compareAtPriceCents,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    inStock: totalStock > 0,
    sizes,
    image: p.images[0] ?? null,
    imagesAreIllustrations: p.imagesAreIllustrations,
  };
}

export type ProductCard = ReturnType<typeof toProductCard>;

export async function listProducts(query: ProductQuery) {
  let categoryIds: string[] | undefined;
  if (query.category) {
    categoryIds = await categoryIdsWithDescendants(query.category);
    if (categoryIds.length === 0) throw notFound('Catégorie introuvable');
  }
  const where = buildProductWhere(query, categoryIds);
  const facetWhere = buildProductWhere({ ...query, brand: undefined, size: undefined, minPrice: undefined, maxPrice: undefined }, categoryIds);

  const [total, rows, facetRows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy: buildOrderBy(query.sort),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.product.findMany({
      where: facetWhere,
      select: {
        brand: true,
        priceFromCents: true,
        condition: true,
        variants: { where: { isActive: true }, select: { size: { select: { label: true, sortOrder: true } } } },
      },
    }),
  ]);

  const brands = [...new Set(facetRows.map((r) => r.brand))].sort((a, b) => a.localeCompare(b, 'fr'));
  const sizeMap = new Map<string, number>();
  for (const r of facetRows) for (const v of r.variants) if (v.size) sizeMap.set(v.size.label, v.size.sortOrder);
  const sizes = [...sizeMap.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0], 'fr', { numeric: true })).map(([label]) => label);
  const prices = facetRows.map((r) => r.priceFromCents).filter((p): p is number => p != null);

  return {
    items: rows.map(toProductCard),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    facets: {
      brands,
      sizes,
      conditions: [...new Set(facetRows.map((r) => r.condition))],
      price: prices.length ? { min: Math.floor(Math.min(...prices) / 100), max: Math.ceil(Math.max(...prices) / 100) } : null,
    },
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, status: 'ACTIVE' },
    include: {
      category: { select: { slug: true, name: true, parent: { select: { slug: true, name: true } } } },
      images: { orderBy: { position: 'asc' }, select: { url: true, alt: true, width: true, height: true } },
      variants: {
        where: { isActive: true },
        orderBy: [{ position: 'asc' }],
        select: {
          id: true,
          sku: true,
          color: true,
          priceCents: true,
          compareAtPriceCents: true,
          size: { select: { label: true, system: true, sortOrder: true } },
          stock: { select: { quantity: true } },
        },
      },
    },
  });
  if (!product) throw notFound('Produit introuvable');

  const related = await prisma.product.findMany({
    where: { status: 'ACTIVE', categoryId: product.categoryId, id: { not: product.id } },
    select: productCardSelect,
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    take: 4,
  });
  let relatedCards = related.map(toProductCard);
  if (relatedCards.length < 4) {
    const more = await prisma.product.findMany({
      where: { status: 'ACTIVE', sport: product.sport, id: { notIn: [product.id, ...related.map((r) => r.id)] } },
      select: productCardSelect,
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      take: 4 - relatedCards.length,
    });
    relatedCards = relatedCards.concat(more.map(toProductCard));
  }

  const variants = product.variants.map((v) => {
    const quantity = v.stock?.quantity ?? 0;
    return {
      id: v.id,
      sku: v.sku,
      color: v.color,
      priceCents: v.priceCents,
      compareAtPriceCents: v.compareAtPriceCents,
      size: v.size ? { label: v.size.label, system: v.size.system } : null,
      available: Math.min(quantity, PUBLIC_STOCK_CAP),
      inStock: quantity > 0,
    };
  });

  return {
    id: product.id,
    reference: product.reference,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    model: product.model,
    shortDescription: product.shortDescription,
    description: product.description,
    sport: product.sport,
    condition: product.condition,
    currency: product.currency,
    category: product.category,
    specs: product.specs,
    colors: product.colors,
    weightGrams: product.weightGrams,
    dimensions: product.dimensions,
    isNew: product.isNew,
    imagesAreIllustrations: product.imagesAreIllustrations,
    images: product.images,
    variants,
    priceFromCents: variants.length ? Math.min(...variants.map((v) => v.priceCents)) : product.priceFromCents,
    compareAtPriceCents: product.compareAtPriceCents,
    inStock: variants.some((v) => v.inStock),
    updatedAt: product.updatedAt,
    related: relatedCards,
  };
}

export async function listCategories() {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({
      where: { isVisible: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: { id: true, slug: true, name: true, description: true, sport: true, parentId: true, position: true },
    }),
    prisma.product.groupBy({ by: ['categoryId'], where: { status: 'ACTIVE' }, _count: { _all: true } }),
  ]);
  const direct = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  const total = (id: string): number =>
    (direct.get(id) ?? 0) + categories.filter((c) => c.parentId === id).reduce((s, c) => s + total(c.id), 0);
  return categories.map((c) => ({ ...c, productCount: total(c.id) }));
}

export async function getHomeData() {
  const base = { status: 'ACTIVE' as const };
  const [featured, ski, hockey, accessories, newest] = await Promise.all([
    prisma.product.findMany({ where: { ...base, isFeatured: true }, select: productCardSelect, take: 8, orderBy: { name: 'asc' } }),
    prisma.product.findMany({ where: { ...base, sport: 'SKI', category: { slug: { in: ['skis', 'skis-all-mountain-freeride', 'skis-junior'] } } }, select: productCardSelect, take: 4, orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }] }),
    prisma.product.findMany({ where: { ...base, sport: 'HOCKEY' }, select: productCardSelect, take: 4, orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }] }),
    prisma.product.findMany({ where: { ...base, category: { OR: [{ slug: 'accessoires' }, { parent: { slug: 'accessoires' } }] } }, select: productCardSelect, take: 4, orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }] }),
    prisma.product.findMany({ where: { ...base, isNew: true }, select: productCardSelect, take: 4, orderBy: { createdAt: 'desc' } }),
  ]);
  return {
    featured: featured.map(toProductCard),
    ski: ski.map(toProductCard),
    hockey: hockey.map(toProductCard),
    accessories: accessories.map(toProductCard),
    newest: newest.map(toProductCard),
  };
}

export async function sitemapEntries() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { status: 'ACTIVE' }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ where: { isVisible: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return { products, categories };
}
