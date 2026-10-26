import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { asyncHandler } from '../../lib/http';
import { conflict, notFound, unprocessable } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { logActivity } from '../../lib/activity';
import { slugify } from '../../lib/slug';
import { getStorage } from '../storage/storage';

export const adminProductsRouter = Router();

const idParam = z.string().min(1).max(64);
const cents = z.coerce.number().int().min(0).max(10_000_000);

const productBody = z.object({
  reference: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9-]+$/),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,120}$/).optional(),
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().max(120).optional().nullable(),
  shortDescription: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(8000).optional().nullable(),
  categoryId: z.string().min(1).max(64),
  sport: z.enum(['SKI', 'HOCKEY']),
  condition: z.enum(['NEW', 'USED']).default('NEW'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  compareAtPriceCents: cents.optional().nullable(),
  weightGrams: z.coerce.number().int().min(0).max(100_000).optional().nullable(),
  dimensions: z.string().trim().max(120).optional().nullable(),
  colors: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  specs: z.record(z.string().max(60), z.string().max(200)).optional().nullable(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  imagesAreIllustrations: z.boolean().default(true),
});

const variantBody = z.object({
  sku: z.string().trim().min(2).max(60).regex(/^[A-Za-z0-9._-]+$/).optional(),
  sizeLabel: z.string().trim().max(40).optional().nullable(),
  sizeSystem: z.string().trim().max(30).default('GENERIC'),
  color: z.string().trim().max(40).optional().nullable(),
  priceCents: cents.refine((v) => v > 0, 'Le prix doit être supérieur à 0'),
  compareAtPriceCents: cents.optional().nullable(),
  isActive: z.boolean().default(true),
  stock: z.coerce.number().int().min(0).max(100_000).default(0),
});

async function refreshPriceFrom(productId: string, tx: Prisma.TransactionClient = prisma) {
  const agg = await tx.productVariant.aggregate({ where: { productId, isActive: true }, _min: { priceCents: true } });
  await tx.product.update({ where: { id: productId }, data: { priceFromCents: agg._min.priceCents ?? null } });
}

async function resolveSizeId(label: string | null | undefined, system: string, tx: Prisma.TransactionClient = prisma) {
  if (!label) return null;
  const size = await tx.size.upsert({ where: { system_label: { system, label } }, create: { system, label }, update: {} });
  return size.id;
}

async function assertPublishable(productId: string) {
  const sellable = await prisma.productVariant.count({ where: { productId, isActive: true, priceCents: { gt: 0 } } });
  const images = await prisma.productImage.count({ where: { productId } });
  if (sellable === 0) throw unprocessable('NOT_PUBLISHABLE', 'Ajoutez au moins une variante active avec un prix avant de publier');
  if (images === 0) throw unprocessable('NOT_PUBLISHABLE', 'Ajoutez au moins une image avant de publier');
}

adminProductsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        q: z.string().trim().max(100).optional(),
        status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
        page: z.coerce.number().int().min(1).default(1),
      })
      .parse(req.query);
    const where: Prisma.ProductWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.q
        ? { OR: [{ name: { contains: q.q, mode: 'insensitive' } }, { reference: { contains: q.q, mode: 'insensitive' } }, { brand: { contains: q.q, mode: 'insensitive' } }] }
        : {}),
    };
    const pageSize = 25;
    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { reference: 'asc' },
        skip: (q.page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { name: true } },
          images: { take: 1, orderBy: { position: 'asc' }, select: { url: true, alt: true } },
          variants: { select: { isActive: true, priceCents: true, stock: { select: { quantity: true } } } },
        },
      }),
    ]);
    res.json({
      total,
      page: q.page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      items: rows.map((p) => ({
        id: p.id,
        reference: p.reference,
        name: p.name,
        brand: p.brand,
        status: p.status,
        category: p.category.name,
        image: p.images[0] ?? null,
        priceFromCents: p.priceFromCents,
        variantCount: p.variants.length,
        totalStock: p.variants.reduce((s, v) => s + (v.stock?.quantity ?? 0), 0),
      })),
    });
  }),
);

adminProductsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({
      where: { id: idParam.parse(req.params.id) },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: { orderBy: { position: 'asc' }, include: { size: true, stock: true } },
      },
    });
    if (!product) throw notFound('Produit introuvable');
    res.json({ product });
  }),
);

adminProductsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = productBody.parse(req.body);
    const status = input.status === 'ACTIVE' ? 'DRAFT' : input.status;
    const product = await prisma.product.create({
      data: { ...input, status, slug: input.slug ?? slugify(`${input.brand} ${input.name}`), specs: input.specs ?? undefined },
    });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'product.created', entityType: 'Product', entityId: product.id, metadata: { reference: product.reference } });
    res.status(201).json({ product });
  }),
);

adminProductsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const input = productBody.partial().parse(req.body);
    if (input.status === 'ACTIVE') await assertPublishable(id);
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...input,
        specs: input.specs === null ? undefined : input.specs,
        archivedAt: input.status === 'ARCHIVED' ? new Date() : input.status ? null : undefined,
      },
    });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'product.updated', entityType: 'Product', entityId: id, metadata: { fields: Object.keys(input) } });
    res.json({ product });
  }),
);

adminProductsRouter.post(
  '/:id/archive',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const product = await prisma.product.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'product.archived', entityType: 'Product', entityId: id });
    res.json({ product });
  }),
);

adminProductsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const ordered = await prisma.orderItem.count({ where: { variant: { productId: id } } });
    if (ordered > 0) throw conflict('Ce produit figure dans des commandes : archivez-le au lieu de le supprimer');
    await prisma.product.delete({ where: { id } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'product.deleted', entityType: 'Product', entityId: id });
    res.status(204).end();
  }),
);

adminProductsRouter.post(
  '/:id/variants',
  asyncHandler(async (req, res) => {
    const productId = idParam.parse(req.params.id);
    const input = variantBody.parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { reference: true } });
    if (!product) throw notFound('Produit introuvable');
    const variant = await prisma.$transaction(async (tx) => {
      const sizeId = await resolveSizeId(input.sizeLabel, input.sizeSystem, tx);
      const position = await tx.productVariant.count({ where: { productId } });
      const created = await tx.productVariant.create({
        data: {
          productId,
          sku: input.sku ?? `${product.reference}-${slugify(input.sizeLabel ?? 'unique')}-${randomUUID().slice(0, 4)}`.toUpperCase(),
          sizeId,
          color: input.color ?? null,
          priceCents: input.priceCents,
          compareAtPriceCents: input.compareAtPriceCents ?? null,
          isActive: input.isActive,
          position,
          stock: { create: { quantity: input.stock } },
        },
      });
      if (input.stock > 0) await tx.stockMovement.create({ data: { variantId: created.id, type: 'ADJUSTMENT', delta: input.stock, reason: 'Création', actorId: req.user!.id } });
      await refreshPriceFrom(productId, tx);
      return created;
    });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'variant.created', entityType: 'ProductVariant', entityId: variant.id });
    res.status(201).json({ variant });
  }),
);

adminProductsRouter.patch(
  '/variants/:variantId',
  asyncHandler(async (req, res) => {
    const variantId = idParam.parse(req.params.variantId);
    const input = variantBody.omit({ stock: true }).partial().parse(req.body);
    const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!existing) throw notFound('Variante introuvable');
    const variant = await prisma.$transaction(async (tx) => {
      const sizeId = input.sizeLabel !== undefined ? await resolveSizeId(input.sizeLabel, input.sizeSystem ?? 'GENERIC', tx) : undefined;
      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: {
          sku: input.sku,
          sizeId,
          color: input.color,
          priceCents: input.priceCents,
          compareAtPriceCents: input.compareAtPriceCents,
          isActive: input.isActive,
        },
      });
      await refreshPriceFrom(existing.productId, tx);
      return updated;
    });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'variant.updated', entityType: 'ProductVariant', entityId: variantId, metadata: { fields: Object.keys(input) } });
    res.json({ variant });
  }),
);

adminProductsRouter.put(
  '/variants/:variantId/stock',
  asyncHandler(async (req, res) => {
    const variantId = idParam.parse(req.params.variantId);
    const { quantity, reason } = z
      .object({ quantity: z.coerce.number().int().min(0).max(100_000), reason: z.string().trim().max(200).optional() })
      .parse(req.body);
    const stock = await prisma.$transaction(async (tx) => {
      const current = await tx.stock.upsert({ where: { variantId }, create: { variantId, quantity: 0 }, update: {} });
      const delta = quantity - current.quantity;
      const updated = await tx.stock.update({ where: { variantId }, data: { quantity } });
      if (delta !== 0) {
        await tx.stockMovement.create({ data: { variantId, type: 'ADJUSTMENT', delta, reason: reason ?? 'Ajustement manuel', actorId: req.user!.id } });
      }
      return updated;
    });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'stock.adjusted', entityType: 'ProductVariant', entityId: variantId, metadata: { quantity } });
    res.json({ stock });
  }),
);

adminProductsRouter.delete(
  '/variants/:variantId',
  asyncHandler(async (req, res) => {
    const variantId = idParam.parse(req.params.variantId);
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw notFound('Variante introuvable');
    const ordered = await prisma.orderItem.count({ where: { variantId } });
    if (ordered > 0) {
      await prisma.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
    } else {
      await prisma.productVariant.delete({ where: { id: variantId } });
    }
    await refreshPriceFrom(variant.productId);
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: ordered > 0 ? 'variant.deactivated' : 'variant.deleted', entityType: 'ProductVariant', entityId: variantId });
    res.status(204).end();
  }),
);

const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 3 } });

adminProductsRouter.post(
  '/:id/images',
  imageUpload.single('image'),
  asyncHandler(async (req, res) => {
    const productId = idParam.parse(req.params.id);
    const { alt } = z.object({ alt: z.string().trim().min(3).max(200) }).parse(req.body);
    if (!req.file) throw unprocessable('IMAGE_REQUIRED', 'Image obligatoire');
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw notFound('Produit introuvable');
    let webp: { data: Buffer; info: sharp.OutputInfo };
    try {
      webp = await sharp(req.file.buffer, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw unprocessable('INVALID_IMAGE', 'Image illisible : JPG, PNG ou WEBP attendu');
    }
    const key = `media/products/${randomUUID()}.webp`;
    await getStorage().put(key, webp.data, 'image/webp');
    const position = await prisma.productImage.count({ where: { productId } });
    const image = await prisma.productImage.create({
      data: { productId, url: `/api/${key}`, alt, position, width: webp.info.width, height: webp.info.height, isIllustration: false },
    });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'image.uploaded', entityType: 'Product', entityId: productId });
    res.status(201).json({ image });
  }),
);

adminProductsRouter.patch(
  '/images/:imageId',
  asyncHandler(async (req, res) => {
    const imageId = idParam.parse(req.params.imageId);
    const input = z.object({ alt: z.string().trim().min(3).max(200).optional(), position: z.coerce.number().int().min(0).max(100).optional() }).parse(req.body);
    const image = await prisma.productImage.update({ where: { id: imageId }, data: input });
    res.json({ image });
  }),
);

adminProductsRouter.delete(
  '/images/:imageId',
  asyncHandler(async (req, res) => {
    const imageId = idParam.parse(req.params.imageId);
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) throw notFound('Image introuvable');
    await prisma.productImage.delete({ where: { id: imageId } });
    if (image.url.startsWith('/api/media/')) await getStorage().remove(image.url.slice('/api/'.length)).catch(() => undefined);
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'image.deleted', entityType: 'Product', entityId: image.productId });
    res.status(204).end();
  }),
);
