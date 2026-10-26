import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { CART_ISSUE_MESSAGES, MAX_QUANTITY_PER_LINE, computeCartTotals, validateCartLines, type CartIssue } from '@glaciora/shared';
import { prisma } from '../../lib/prisma';
import { COOKIE, setCartCookie } from '../../lib/cookies';
import { generateOpaqueToken, hashToken } from '../../lib/tokens';
import { notFound, unprocessable } from '../../lib/errors';

const CART_TTL_MS = 30 * 24 * 3600 * 1000;

const cartItemInclude = {
  variant: {
    include: {
      size: { select: { label: true } },
      stock: { select: { quantity: true } },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: true,
          reference: true,
          status: true,
          images: { select: { url: true, alt: true }, orderBy: { position: 'asc' as const }, take: 1 },
        },
      },
    },
  },
} satisfies Prisma.CartItemInclude;

export type CartItemRow = Prisma.CartItemGetPayload<{ include: typeof cartItemInclude }>;

/** Retrouve le panier courant (cookie, sinon compte connecté) sans en créer. */
export async function findCurrentCart(req: Request) {
  const token = req.cookies?.[COOKIE.cart] as string | undefined;
  if (token && token.length <= 100) {
    const cart = await prisma.cart.findUnique({ where: { tokenHash: hashToken(token) } });
    if (cart && cart.expiresAt > new Date()) return cart;
  }
  if (req.user) {
    return prisma.cart.findFirst({ where: { userId: req.user.id, expiresAt: { gt: new Date() } }, orderBy: { updatedAt: 'desc' } });
  }
  return null;
}

export async function getOrCreateCart(req: Request, res: Response) {
  const existing = await findCurrentCart(req);
  if (existing) return existing;
  const token = generateOpaqueToken();
  const cart = await prisma.cart.create({
    data: { tokenHash: hashToken(token), userId: req.user?.id ?? null, expiresAt: new Date(Date.now() + CART_TTL_MS) },
  });
  setCartCookie(res, token, CART_TTL_MS);
  return cart;
}

export function isVariantPurchasable(item: CartItemRow): boolean {
  return item.variant.isActive && item.variant.product.status === 'ACTIVE' && item.variant.priceCents > 0;
}

export function toCartView(items: CartItemRow[]) {
  const lines = items.map((item) => ({
    variantId: item.variantId,
    unitPriceCents: item.variant.priceCents,
    quantity: item.quantity,
    available: item.variant.stock?.quantity ?? 0,
    isPurchasable: isVariantPurchasable(item),
  }));
  const issues = validateCartLines(lines);
  const issueByVariant = new Map<string, CartIssue>(issues.map((i) => [i.variantId, i]));
  const { subtotalCents, itemCount } = computeCartTotals(lines);
  return {
    items: items.map((item) => {
      const issue = issueByVariant.get(item.variantId);
      return {
        variantId: item.variantId,
        sku: item.variant.sku,
        productId: item.variant.product.id,
        productName: item.variant.product.name,
        brand: item.variant.product.brand,
        slug: item.variant.product.slug,
        sizeLabel: item.variant.size?.label ?? null,
        color: item.variant.color,
        image: item.variant.product.images[0] ?? null,
        unitPriceCents: item.variant.priceCents,
        quantity: item.quantity,
        available: Math.min(item.variant.stock?.quantity ?? 0, MAX_QUANTITY_PER_LINE),
        lineTotalCents: item.variant.priceCents * item.quantity,
        issue: issue ? { code: issue.code, message: CART_ISSUE_MESSAGES[issue.code] } : null,
      };
    }),
    subtotalCents,
    itemCount,
    currency: 'EUR',
    hasIssues: issues.length > 0,
  };
}

export async function loadCartItems(cartId: string, tx: Prisma.TransactionClient = prisma) {
  return tx.cartItem.findMany({ where: { cartId }, include: cartItemInclude, orderBy: { createdAt: 'asc' } });
}

export async function getCartView(req: Request) {
  const cart = await findCurrentCart(req);
  if (!cart) return toCartView([]);
  return toCartView(await loadCartItems(cart.id));
}

async function loadVariantForCart(variantId: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { stock: true, product: { select: { status: true } } },
  });
  if (!variant || !variant.isActive || variant.product.status !== 'ACTIVE' || variant.priceCents <= 0) {
    throw notFound('Article indisponible');
  }
  return variant;
}

export async function addItem(req: Request, res: Response, variantId: string, quantity: number) {
  const variant = await loadVariantForCart(variantId);
  const cart = await getOrCreateCart(req, res);
  const existing = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const target = (existing?.quantity ?? 0) + quantity;
  assertQuantity(target, variant.stock?.quantity ?? 0);
  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity: target },
    update: { quantity: target },
  });
  await touch(cart.id);
  return toCartView(await loadCartItems(cart.id));
}

export async function updateItem(req: Request, variantId: string, quantity: number) {
  const cart = await findCurrentCart(req);
  if (!cart) throw notFound('Panier introuvable');
  const item = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  if (!item) throw notFound('Article absent du panier');
  const variant = await loadVariantForCart(variantId);
  assertQuantity(quantity, variant.stock?.quantity ?? 0);
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  await touch(cart.id);
  return toCartView(await loadCartItems(cart.id));
}

export async function removeItem(req: Request, variantId: string) {
  const cart = await findCurrentCart(req);
  if (!cart) return toCartView([]);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  return toCartView(await loadCartItems(cart.id));
}

function assertQuantity(quantity: number, available: number) {
  if (quantity > MAX_QUANTITY_PER_LINE) {
    throw unprocessable('INVALID_QUANTITY', `${MAX_QUANTITY_PER_LINE} exemplaires maximum par article`);
  }
  if (available <= 0) throw unprocessable('OUT_OF_STOCK', 'Article en rupture de stock');
  if (quantity > available) {
    throw unprocessable('INSUFFICIENT_STOCK', `Stock insuffisant : ${available} disponible(s)`, { available });
  }
}

async function touch(cartId: string) {
  await prisma.cart.update({ where: { id: cartId }, data: { expiresAt: new Date(Date.now() + CART_TTL_MS) } });
}

/** À la connexion : rattache le panier invité au compte. */
export async function attachCartToUser(req: Request, userId: string) {
  const token = req.cookies?.[COOKIE.cart] as string | undefined;
  if (!token) return;
  await prisma.cart.updateMany({ where: { tokenHash: hashToken(token), userId: null }, data: { userId } });
}
