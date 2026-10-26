import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { ORDER_STATUSES, ORDER_STATUS_LABELS, canTransition, type OrderStatus } from '@glaciora/shared';
import { env } from '../../config/env';
import { asyncHandler } from '../../lib/http';
import { notFound, unprocessable } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { logActivity } from '../../lib/activity';
import { getStorage } from '../storage/storage';
import { kickEmailQueue, queueEmail } from '../email/email.service';

export const adminOrdersRouter = Router();

const idParam = z.string().min(1).max(64);

adminOrdersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        status: z.enum(ORDER_STATUSES).optional(),
        q: z.string().trim().max(100).optional(),
        page: z.coerce.number().int().min(1).default(1),
      })
      .parse(req.query);
    const where: Prisma.OrderWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.q
        ? {
            OR: [
              { reference: { contains: q.q, mode: 'insensitive' } },
              { email: { contains: q.q, mode: 'insensitive' } },
              { shipLastName: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const pageSize = 25;
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          reference: true,
          status: true,
          totalCents: true,
          createdAt: true,
          shipFirstName: true,
          shipLastName: true,
          shipCountryCode: true,
          payments: { select: { status: true } },
          _count: { select: { proofs: true, items: true } },
        },
      }),
    ]);
    res.json({ total, page: q.page, totalPages: Math.max(1, Math.ceil(total / pageSize)), orders });
  }),
);

adminOrdersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: idParam.parse(req.params.id) },
      include: {
        items: true,
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        payments: { include: { verifiedBy: { select: { firstName: true, lastName: true } } } },
        proofs: { select: { id: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true, deletedAt: true, deleteAfter: true } },
        emails: { select: { id: true, template: true, status: true, attempts: true, sentAt: true, lastError: true, createdAt: true } },
      },
    });
    if (!order) throw notFound('Commande introuvable');
    const { accessTokenHash: _hidden, ...rest } = order;
    const activity = await prisma.activityLog.findMany({
      where: { entityType: 'Order', entityId: order.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actor: { select: { firstName: true, lastName: true } } },
    });
    res.json({ order: rest, activity, allowedTransitions: ORDER_STATUSES.filter((s) => canTransition(order.status, s)) });
  }),
);

adminOrdersRouter.get(
  '/:id/proofs/:proofId',
  asyncHandler(async (req, res) => {
    const orderId = idParam.parse(req.params.id);
    const proofId = idParam.parse(req.params.proofId);
    const proof = await prisma.transferProof.findFirst({ where: { id: proofId, orderId } });
    if (!proof || proof.deletedAt) throw notFound('Fichier introuvable');
    const body = await getStorage().get(proof.storageKey);
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'proof.viewed', entityType: 'Order', entityId: orderId, metadata: { proofId } });
    const download = req.query.download === '1';
    res.set({
      'Content-Type': proof.mimeType,
      'Content-Length': String(body.length),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${proof.originalName.replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    });
    res.send(body);
  }),
);

const statusBody = z.object({
  status: z.enum(ORDER_STATUSES),
  trackingCarrier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(80).optional(),
  trackingUrl: z.string().trim().url().max(300).optional().or(z.literal('')),
  adminNote: z.string().trim().max(1000).optional(),
  notifyCustomer: z.boolean().default(true),
});

adminOrdersRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const input = statusBody.parse(req.body);
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true, user: { select: { id: true } } } });
    if (!order) throw notFound('Commande introuvable');
    const from = order.status as OrderStatus;
    if (!canTransition(from, input.status)) {
      throw unprocessable('INVALID_TRANSITION', `Passage de « ${ORDER_STATUS_LABELS[from]} » à « ${ORDER_STATUS_LABELS[input.status]} » impossible`);
    }
    if (input.status === 'SHIPPED' && !input.trackingNumber && !order.trackingNumber) {
      throw unprocessable('TRACKING_REQUIRED', "Indiquez un numéro de suivi pour marquer la commande comme expédiée");
    }
    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      if (input.status === 'CANCELLED') {
        for (const item of order.items) {
          if (!item.variantId) continue;
          await tx.stock.updateMany({ where: { variantId: item.variantId }, data: { quantity: { increment: item.quantity } } });
          await tx.stockMovement.create({ data: { variantId: item.variantId, type: 'ORDER_RELEASE', delta: item.quantity, orderId: id, actorId: req.user!.id } });
        }
      }
      if (input.status === 'PAID') {
        await tx.payment.updateMany({ where: { orderId: id, status: 'PENDING_VERIFICATION' }, data: { status: 'VERIFIED', verifiedAt: now, verifiedById: req.user!.id } });
      }
      const result = await tx.order.update({
        where: { id },
        data: {
          status: input.status,
          trackingCarrier: input.trackingCarrier ?? undefined,
          trackingNumber: input.trackingNumber ?? undefined,
          trackingUrl: input.trackingUrl === '' ? null : input.trackingUrl ?? undefined,
          adminNote: input.adminNote ?? undefined,
          paidAt: input.status === 'PAID' ? now : undefined,
          shippedAt: input.status === 'SHIPPED' ? now : undefined,
          deliveredAt: input.status === 'DELIVERED' ? now : undefined,
          cancelledAt: input.status === 'CANCELLED' ? now : undefined,
        },
      });
      if (input.notifyCustomer) {
        await queueEmail(
          {
            to: order.email,
            template: 'order-status',
            orderId: id,
            payload: {
              orderReference: order.reference,
              firstName: order.shipFirstName,
              statusLabel: ORDER_STATUS_LABELS[input.status],
              orderUrl: order.user ? `${env.PUBLIC_SITE_URL}/compte/commandes/${order.reference}` : `${env.PUBLIC_SITE_URL}/commande/confirmation?ref=${order.reference}`,
              trackingNumber: result.trackingNumber,
              trackingUrl: result.trackingUrl,
              trackingCarrier: result.trackingCarrier,
            },
          },
          tx,
        );
      }
      await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'order.status_changed', entityType: 'Order', entityId: id, metadata: { from, to: input.status } }, tx);
      return result;
    });
    kickEmailQueue();
    res.json({ order: { id: updated.id, status: updated.status } });
  }),
);

adminOrdersRouter.patch(
  '/:id/tracking',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const input = z
      .object({ trackingCarrier: z.string().trim().max(60).optional(), trackingNumber: z.string().trim().max(80).optional(), trackingUrl: z.string().trim().url().max(300).optional().or(z.literal('')) })
      .parse(req.body);
    const order = await prisma.order.update({ where: { id }, data: { ...input, trackingUrl: input.trackingUrl === '' ? null : input.trackingUrl } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'order.tracking_updated', entityType: 'Order', entityId: id });
    res.json({ order: { id: order.id, trackingNumber: order.trackingNumber } });
  }),
);

adminOrdersRouter.post(
  '/:id/payments/:paymentId/reject',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const paymentId = idParam.parse(req.params.paymentId);
    const { reason } = z.object({ reason: z.string().trim().min(3).max(300) }).parse(req.body);
    const payment = await prisma.payment.findFirst({ where: { id: paymentId, orderId: id } });
    if (!payment) throw notFound('Paiement introuvable');
    await prisma.payment.update({ where: { id: paymentId }, data: { status: 'REJECTED', rejectionReason: reason, verifiedAt: new Date(), verifiedById: req.user!.id } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'payment.rejected', entityType: 'Order', entityId: id });
    res.json({ ok: true });
  }),
);
