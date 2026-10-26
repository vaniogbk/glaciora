import { Router } from 'express';
import { z } from 'zod';
import { addressSchema, profileSchema } from '@glaciora/shared';
import { asyncHandler } from '../../lib/http';
import { notFound } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middlewares/auth';

export const accountRouter = Router();
accountRouter.use(requireAuth);
accountRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const idParam = z.string().min(1).max(64);
const MAX_ADDRESSES = 10;

accountRouter.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true },
    });
    res.json({ profile: user });
  }),
);

accountRouter.patch(
  '/profile',
  asyncHandler(async (req, res) => {
    const input = profileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { firstName: input.firstName, lastName: input.lastName, phone: input.phone || null },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, createdAt: true },
    });
    res.json({ profile: user });
  }),
);

accountRouter.get(
  '/addresses',
  asyncHandler(async (req, res) => {
    const addresses = await prisma.address.findMany({ where: { userId: req.user!.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] });
    res.json({ addresses });
  }),
);

const addressBody = addressSchema.extend({ label: z.string().trim().max(40).optional().or(z.literal('')), isDefault: z.boolean().optional() });

function toAddressData(input: z.infer<typeof addressBody>) {
  return {
    label: input.label || null,
    firstName: input.firstName,
    lastName: input.lastName,
    company: input.company || null,
    line1: input.line1,
    line2: input.line2 || null,
    postalCode: input.postalCode,
    city: input.city,
    region: input.region || null,
    countryCode: input.countryCode,
    phone: input.phone,
  };
}

accountRouter.post(
  '/addresses',
  asyncHandler(async (req, res) => {
    const input = addressBody.parse(req.body);
    const userId = req.user!.id;
    const count = await prisma.address.count({ where: { userId } });
    if (count >= MAX_ADDRESSES) {
      res.status(422).json({ error: { code: 'TOO_MANY_ADDRESSES', message: `${MAX_ADDRESSES} adresses maximum` } });
      return;
    }
    const address = await prisma.$transaction(async (tx) => {
      const isDefault = input.isDefault ?? count === 0;
      if (isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.create({ data: { ...toAddressData(input), userId, isDefault } });
    });
    res.status(201).json({ address });
  }),
);

accountRouter.patch(
  '/addresses/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const input = addressBody.parse(req.body);
    const userId = req.user!.id;
    const existing = await prisma.address.findFirst({ where: { id, userId } });
    if (!existing) throw notFound('Adresse introuvable');
    const address = await prisma.$transaction(async (tx) => {
      if (input.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      return tx.address.update({ where: { id }, data: { ...toAddressData(input), isDefault: input.isDefault ?? existing.isDefault } });
    });
    res.json({ address });
  }),
);

accountRouter.delete(
  '/addresses/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const deleted = await prisma.address.deleteMany({ where: { id, userId: req.user!.id } });
    if (deleted.count === 0) throw notFound('Adresse introuvable');
    res.status(204).end();
  }),
);

accountRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      select: {
        reference: true,
        status: true,
        totalCents: true,
        createdAt: true,
        trackingNumber: true,
        _count: { select: { items: true } },
        payments: { select: { status: true, method: true } },
      },
    });
    res.json({ orders });
  }),
);

accountRouter.get(
  '/orders/:reference',
  asyncHandler(async (req, res) => {
    const reference = z.string().regex(/^GLA-\d{6}-[A-Z0-9]{5}$/).parse(req.params.reference);
    const order = await prisma.order.findFirst({
      where: { reference, userId: req.user!.id },
      include: {
        items: true,
        payments: { select: { method: true, status: true, amountCents: true, verifiedAt: true } },
        proofs: { select: { createdAt: true, originalName: true } },
      },
    });
    if (!order) throw notFound('Commande introuvable');
    const { accessTokenHash: _hidden, adminNote: _note, ...rest } = order;
    res.json({ order: rest });
  }),
);
