import { existsSync } from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env';
import { asyncHandler } from '../../lib/http';
import { conflict, notFound } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { logActivity } from '../../lib/activity';
import { slugify } from '../../lib/slug';
import { kickEmailQueue } from '../email/email.service';
import { runCatalogueImport } from '../catalogue-import/import.service';

export const adminSettingsRouter = Router();

const idParam = z.string().min(1).max(64);
const cents = z.coerce.number().int().min(0).max(1_000_000);

/* ---------- Tableau de bord ---------- */
adminSettingsRouter.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [pending, byStatus, revenue, products, lowStock, recent, failedEmails] = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING_PAYMENT_VERIFICATION' } }),
      prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.order.aggregate({ where: { status: { in: ['PAID', 'PREPARING', 'SHIPPED', 'DELIVERED'] }, paidAt: { gte: since } }, _sum: { totalCents: true } }),
      prisma.product.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.stock.count({ where: { quantity: { lte: 1 }, variant: { isActive: true, product: { status: 'ACTIVE' } } } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, reference: true, status: true, totalCents: true, createdAt: true, shipLastName: true },
      }),
      prisma.emailMessage.count({ where: { status: 'FAILED' } }),
    ]);
    res.json({
      pendingVerification: pending,
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      revenue30dCents: revenue._sum.totalCents ?? 0,
      productsByStatus: Object.fromEntries(products.map((p) => [p.status, p._count._all])),
      lowStockVariants: lowStock,
      failedEmails,
      recentOrders: recent,
    });
  }),
);

/* ---------- Catégories ---------- */
const categoryBody = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  sport: z.enum(['SKI', 'HOCKEY']).optional().nullable(),
  parentId: z.string().max(64).optional().nullable(),
  position: z.coerce.number().int().min(0).max(1000).default(0),
  isVisible: z.boolean().default(true),
});

adminSettingsRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { position: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    res.json({ categories });
  }),
);

adminSettingsRouter.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const input = categoryBody.parse(req.body);
    const category = await prisma.category.create({ data: { ...input, slug: input.slug ?? slugify(input.name) } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'category.created', entityType: 'Category', entityId: category.id });
    res.status(201).json({ category });
  }),
);

adminSettingsRouter.patch(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const input = categoryBody.partial().parse(req.body);
    if (input.parentId === id) throw conflict('Une catégorie ne peut pas être son propre parent');
    const category = await prisma.category.update({ where: { id }, data: input });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'category.updated', entityType: 'Category', entityId: id });
    res.json({ category });
  }),
);

adminSettingsRouter.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const [products, children] = await Promise.all([prisma.product.count({ where: { categoryId: id } }), prisma.category.count({ where: { parentId: id } })]);
    if (products > 0 || children > 0) throw conflict('Catégorie non vide : déplacez ses produits et sous-catégories avant de la supprimer');
    await prisma.category.delete({ where: { id } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'category.deleted', entityType: 'Category', entityId: id });
    res.status(204).end();
  }),
);

adminSettingsRouter.get(
  '/sizes',
  asyncHandler(async (_req, res) => {
    res.json({ sizes: await prisma.size.findMany({ orderBy: [{ system: 'asc' }, { sortOrder: 'asc' }] }) });
  }),
);

/* ---------- Clients (lecture + activation uniquement) ---------- */
adminSettingsRouter.get(
  '/customers',
  asyncHandler(async (req, res) => {
    const q = z.object({ q: z.string().trim().max(100).optional(), page: z.coerce.number().int().min(1).default(1) }).parse(req.query);
    const where = {
      role: 'CLIENT' as const,
      ...(q.q ? { OR: [{ email: { contains: q.q, mode: 'insensitive' as const } }, { lastName: { contains: q.q, mode: 'insensitive' as const } }] } : {}),
    };
    const pageSize = 25;
    const [total, customers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * pageSize,
        take: pageSize,
        select: { id: true, email: true, firstName: true, lastName: true, isActive: true, createdAt: true, lastLoginAt: true, _count: { select: { orders: true } } },
      }),
    ]);
    res.json({ total, page: q.page, totalPages: Math.max(1, Math.ceil(total / pageSize)), customers });
  }),
);

adminSettingsRouter.get(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    const customer = await prisma.user.findFirst({
      where: { id: idParam.parse(req.params.id), role: 'CLIENT' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        addresses: { select: { id: true, city: true, countryCode: true, isDefault: true } },
        orders: { orderBy: { createdAt: 'desc' }, select: { id: true, reference: true, status: true, totalCents: true, createdAt: true } },
      },
    });
    if (!customer) throw notFound('Client introuvable');
    res.json({ customer });
  }),
);

adminSettingsRouter.patch(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    const updated = await prisma.user.updateMany({ where: { id, role: 'CLIENT' }, data: { isActive } });
    if (updated.count === 0) throw notFound('Client introuvable');
    if (!isActive) await prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: isActive ? 'customer.activated' : 'customer.deactivated', entityType: 'User', entityId: id });
    res.json({ ok: true });
  }),
);

/* ---------- Livraison ---------- */
adminSettingsRouter.get(
  '/shipping',
  asyncHandler(async (_req, res) => {
    const [zones, countries] = await Promise.all([
      prisma.shippingZone.findMany({ orderBy: { name: 'asc' }, include: { rates: { orderBy: { priceCents: 'asc' } }, countries: { orderBy: { name: 'asc' } } } }),
      prisma.shippingCountry.findMany({ orderBy: { name: 'asc' } }),
    ]);
    res.json({ zones, countries });
  }),
);

adminSettingsRouter.post(
  '/shipping/zones',
  asyncHandler(async (req, res) => {
    const input = z.object({ name: z.string().trim().min(2).max(60), isActive: z.boolean().default(true) }).parse(req.body);
    const zone = await prisma.shippingZone.create({ data: input });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'shipping.zone_created', entityType: 'ShippingZone', entityId: zone.id });
    res.status(201).json({ zone });
  }),
);

adminSettingsRouter.patch(
  '/shipping/zones/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const input = z.object({ name: z.string().trim().min(2).max(60).optional(), isActive: z.boolean().optional() }).parse(req.body);
    const zone = await prisma.shippingZone.update({ where: { id }, data: input });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'shipping.zone_updated', entityType: 'ShippingZone', entityId: id });
    res.json({ zone });
  }),
);

adminSettingsRouter.delete(
  '/shipping/zones/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    await prisma.shippingZone.delete({ where: { id } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'shipping.zone_deleted', entityType: 'ShippingZone', entityId: id });
    res.status(204).end();
  }),
);

const rateBody = z.object({
  name: z.string().trim().min(2).max(60),
  priceCents: cents,
  freeAboveCents: cents.optional().nullable(),
  minDays: z.coerce.number().int().min(0).max(60).optional().nullable(),
  maxDays: z.coerce.number().int().min(0).max(60).optional().nullable(),
  isActive: z.boolean().default(true),
});

adminSettingsRouter.post(
  '/shipping/zones/:id/rates',
  asyncHandler(async (req, res) => {
    const zoneId = idParam.parse(req.params.id);
    const rate = await prisma.shippingRate.create({ data: { ...rateBody.parse(req.body), zoneId } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'shipping.rate_created', entityType: 'ShippingRate', entityId: rate.id, metadata: { priceCents: rate.priceCents } });
    res.status(201).json({ rate });
  }),
);

adminSettingsRouter.patch(
  '/shipping/rates/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const rate = await prisma.shippingRate.update({ where: { id }, data: rateBody.partial().parse(req.body) });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'shipping.rate_updated', entityType: 'ShippingRate', entityId: id, metadata: { priceCents: rate.priceCents } });
    res.json({ rate });
  }),
);

adminSettingsRouter.delete(
  '/shipping/rates/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    await prisma.shippingRate.delete({ where: { id } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'shipping.rate_deleted', entityType: 'ShippingRate', entityId: id });
    res.status(204).end();
  }),
);

adminSettingsRouter.patch(
  '/shipping/countries/:code',
  asyncHandler(async (req, res) => {
    const code = z.string().regex(/^[A-Z]{2}$/).parse(req.params.code);
    const input = z.object({ isEnabled: z.boolean().optional(), zoneId: z.string().max(64).nullable().optional() }).parse(req.body);
    const country = await prisma.shippingCountry.update({ where: { code }, data: input });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'shipping.country_updated', entityType: 'ShippingCountry', entityId: code, metadata: input });
    res.json({ country });
  }),
);

/* ---------- Journaux, e-mails, import ---------- */
adminSettingsRouter.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const q = z.object({ entityType: z.string().max(40).optional(), page: z.coerce.number().int().min(1).default(1) }).parse(req.query);
    const pageSize = 50;
    const where = q.entityType ? { entityType: q.entityType } : {};
    const [total, logs] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * pageSize,
        take: pageSize,
        include: { actor: { select: { firstName: true, lastName: true, role: true } } },
      }),
    ]);
    res.json({ total, page: q.page, totalPages: Math.max(1, Math.ceil(total / pageSize)), logs });
  }),
);

adminSettingsRouter.get(
  '/emails',
  asyncHandler(async (_req, res) => {
    const emails = await prisma.emailMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, template: true, subject: true, status: true, attempts: true, lastError: true, sentAt: true, createdAt: true, provider: true, order: { select: { id: true, reference: true } } },
    });
    res.json({ emails });
  }),
);

adminSettingsRouter.post(
  '/emails/:id/retry',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    await prisma.emailMessage.update({ where: { id }, data: { status: 'QUEUED', nextAttemptAt: new Date(), attempts: 0 } });
    kickEmailQueue();
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'email.retried', entityType: 'EmailMessage', entityId: id });
    res.json({ ok: true });
  }),
);

adminSettingsRouter.get(
  '/import/runs',
  asyncHandler(async (_req, res) => {
    const runs = await prisma.importRun.findMany({ orderBy: { startedAt: 'desc' }, take: 20 });
    res.json({ runs, catalogueAvailable: existsSync(path.resolve(env.CATALOGUE_DIR)) });
  }),
);

adminSettingsRouter.post(
  '/import',
  asyncHandler(async (req, res) => {
    const dir = path.resolve(env.CATALOGUE_DIR);
    if (!existsSync(dir)) {
      throw conflict("Dossier catalogue absent sur ce serveur : lancez « npm run import:catalogue » depuis un poste qui contient GLACIORA_CATALOGUE (voir README).");
    }
    const report = await runCatalogueImport({ catalogueDir: dir, triggeredById: req.user!.id, copyImages: false });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'catalogue.imported', entityType: 'ImportRun', entityId: report.runId, metadata: report.summary });
    res.json({ report });
  }),
);
