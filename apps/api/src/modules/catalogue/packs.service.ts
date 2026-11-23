import { PACKS, packDiscountCents, type PackDefinition } from '@glaciora/shared';
import { notFound } from '../../lib/errors';
import { prisma } from '../../lib/prisma';

/** Au-delà, le stock exact n'est pas affiché (comme sur les fiches produit). */
const PUBLIC_STOCK_CAP = 10;

const itemSelect = {
  id: true,
  reference: true,
  slug: true,
  name: true,
  brand: true,
  sport: true,
  shortDescription: true,
  category: { select: { slug: true, name: true } },
  images: { orderBy: { position: 'asc' as const }, take: 1, select: { url: true, alt: true, width: true, height: true } },
  variants: {
    where: { isActive: true, priceCents: { gt: 0 } },
    orderBy: [{ position: 'asc' as const }],
    select: { id: true, sku: true, color: true, priceCents: true, size: { select: { label: true } }, stock: { select: { quantity: true } } },
  },
};

/**
 * Pack prêt à la vente : chaque article est publié et a au moins une taille en stock. Sinon null (pack masqué).
 * Prix du pack = somme du prix le plus bas de chaque article, moins la remise du pack.
 */
async function buildPack(pack: PackDefinition) {
  const products = await prisma.product.findMany({ where: { reference: { in: [...pack.references] }, status: 'ACTIVE' }, select: itemSelect });
  const byRef = new Map(products.map((p) => [p.reference, p]));
  const items = [];
  for (const ref of pack.references) {
    const p = byRef.get(ref);
    if (!p) return null;
    const variants = p.variants.map((v) => {
      const quantity = v.stock?.quantity ?? 0;
      return { id: v.id, sku: v.sku, color: v.color, priceCents: v.priceCents, size: v.size?.label ?? null, available: Math.min(quantity, PUBLIC_STOCK_CAP), inStock: quantity > 0 };
    });
    const inStock = variants.filter((v) => v.inStock);
    if (inStock.length === 0) return null;
    items.push({
      reference: p.reference,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      shortDescription: p.shortDescription,
      category: p.category,
      image: p.images[0] ?? null,
      fromPriceCents: Math.min(...inStock.map((v) => v.priceCents)),
      variants,
    });
  }
  const itemsTotalCents = items.reduce((sum, i) => sum + i.fromPriceCents, 0);
  const discountCents = packDiscountCents(itemsTotalCents, pack.discountPercent);
  return {
    slug: pack.slug,
    name: pack.name,
    sport: pack.sport,
    discountPercent: pack.discountPercent,
    itemsTotalCents,
    discountCents,
    packPriceCents: itemsTotalCents - discountCents,
    images: items.map((i) => i.image).filter((i): i is NonNullable<typeof i> => i !== null).slice(0, 4),
    items,
  };
}

export async function listPacks() {
  const built = await Promise.all(PACKS.map(buildPack));
  return built.filter((p): p is NonNullable<typeof p> => p !== null);
}

export async function getPack(slug: string) {
  const definition = PACKS.find((p) => p.slug === slug);
  const pack = definition ? await buildPack(definition) : null;
  if (!pack) throw notFound('Pack introuvable');
  return pack;
}
