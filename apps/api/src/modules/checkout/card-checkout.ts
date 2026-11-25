import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { checkoutSchema, localizedPath, type CheckoutInput } from '@glaciora/shared';
import { env } from '../../config/env';
import { AppError, badRequest, notFound } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { generateOpaqueToken, hashToken } from '../../lib/tokens';
import { logActivity } from '../../lib/activity';
import { kickEmailQueue, queueEmail } from '../email/email.service';
import { CARD_FAILURE_STATUSES, cardWebhookUrl, getCardProvider, getReadyCardProvider, type CardPayment } from '../payments/card-provider';
import { newReference } from './checkout-reference';
import { loadOrderCart, orderFields, requireCart, reserveStock, setOrderAccessCookie } from './checkout.service';
import { orderTrackingUrl } from './order-tracking';

/** État d'un paiement carte vu par le client au retour de la page de paiement. */
export type CardOrderState = 'paid' | 'pending' | 'failed';

/** Paiement en attente plus ancien que ce délai : relu chez le prestataire par la tâche de fond (webhook perdu). */
const STALE_AFTER_MS = 15 * 60_000;
/** Paiement jamais créé chez le prestataire (coupure entre la commande et l'appel) : commande annulée après ce délai. */
const ORPHAN_AFTER_MS = 60 * 60_000;

const cardUnavailable = () => new AppError(503, 'CARD_UNAVAILABLE', 'Le paiement par carte est momentanément indisponible');

/**
 * Commande payée par carte : la commande est enregistrée « paiement à vérifier » et le stock réservé, puis le client part
 * sur la page de paiement hébergée par Mollie. Le panier n'est vidé qu'une fois le paiement confirmé par Mollie : un refus
 * ou un abandon rend le stock et laisse le panier intact pour réessayer.
 */
export async function placeCardOrder(req: Request, res: Response, rawData: unknown) {
  const provider = await getReadyCardProvider();
  if (!provider) throw cardUnavailable();
  const data = checkoutSchema.parse(rawData);
  if (data.paymentMethod !== 'CARD') throw badRequest('Mode de paiement invalide pour cette étape');
  const cart = await requireCart(req);
  const accessToken = generateOpaqueToken();
  const order = await createPendingCardOrder(req, data, cart.id, accessToken, provider.name);
  const paymentId = order.payments[0]!.id;

  let remote: Awaited<ReturnType<typeof provider.createPayment>>;
  try {
    remote = await provider.createPayment({
      amountCents: order.totalCents,
      currency: 'EUR',
      description: `GLACIORA ${order.reference}`,
      redirectUrl: `${env.PUBLIC_SITE_URL.replace(/\/$/, '')}${localizedPath(order.locale, '/commande/carte')}?ref=${encodeURIComponent(order.reference)}`,
      webhookUrl: cardWebhookUrl(),
      locale: order.locale,
      metadata: { orderId: order.id, reference: order.reference, cartId: cart.id },
    });
  } catch (err) {
    await closeCardOrder(paymentId, 'Paiement non créé chez le prestataire');
    throw err instanceof AppError ? err : cardUnavailable();
  }
  await prisma.payment.update({ where: { id: paymentId }, data: { providerPaymentId: remote.providerPaymentId } });
  setOrderAccessCookie(res, order.reference, accessToken);
  return { reference: order.reference, totalCents: order.totalCents, checkoutUrl: remote.checkoutUrl };
}

async function createPendingCardOrder(req: Request, data: CheckoutInput, cartId: string, accessToken: string, providerName: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const orderCart = await loadOrderCart(tx, cartId, data);
        await reserveStock(tx, orderCart.items);
        const created = await tx.order.create({
          data: {
            reference: newReference(),
            // « En préparation » seulement quand Mollie confirme le paiement.
            status: 'PENDING_PAYMENT_VERIFICATION',
            ...orderFields(req, data, orderCart),
            accessTokenHash: hashToken(accessToken),
            payments: { create: { method: 'CARD', amountCents: orderCart.totalCents, provider: providerName } },
          },
          include: { payments: true },
        });
        await tx.stockMovement.createMany({
          data: orderCart.items.map((item) => ({ variantId: item.variantId, type: 'ORDER_RESERVE' as const, delta: -item.quantity, orderId: created.id })),
        });
        await logActivity(
          { actorId: req.user?.id, actorRole: req.user?.role, action: 'order.created', entityType: 'Order', entityId: created.id, metadata: { reference: created.reference, totalCents: created.totalCents, method: 'CARD' } },
          tx,
        );
        return created;
      });
    } catch (err) {
      // Référence déjà prise (tirage aléatoire) : nouvelle tentative avec une autre référence.
      if (attempt < 3 && err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') continue;
      throw err;
    }
  }
}

/** Paiement échoué, annulé ou expiré : paiement refusé, commande annulée et stock rendu, une seule fois même si Mollie rappelle. */
export async function closeCardOrder(paymentId: string, reason: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const rejected = await tx.payment.updateMany({ where: { id: paymentId, status: 'PENDING_VERIFICATION' }, data: { status: 'REJECTED', rejectionReason: reason } });
    if (rejected.count === 0) return;
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { order: { include: { items: true } } } });
    const cancelled = await tx.order.updateMany({ where: { id: payment.orderId, status: 'PENDING_PAYMENT_VERIFICATION' }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    if (cancelled.count === 0) return;
    for (const item of payment.order.items) {
      if (!item.variantId) continue;
      await tx.stock.updateMany({ where: { variantId: item.variantId }, data: { quantity: { increment: item.quantity } } });
      await tx.stockMovement.create({ data: { variantId: item.variantId, type: 'ORDER_RELEASE', delta: item.quantity, orderId: payment.orderId } });
    }
    await logActivity({ action: 'payment.card.failed', entityType: 'Order', entityId: payment.orderId, metadata: { reference: payment.order.reference, reason } }, tx);
  });
}

/** Paiement confirmé par Mollie : commande « En préparation », panier vidé, e-mails au client et à la boutique (une seule fois). */
async function markCardPaid(paymentId: string, remote: CardPayment): Promise<void> {
  const done = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const verified = await tx.payment.updateMany({ where: { id: paymentId, status: 'PENDING_VERIFICATION' }, data: { status: 'VERIFIED', verifiedAt: now } });
    if (verified.count === 0) return false;
    const { order, amountCents } = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { order: { include: { items: true } } } });
    const advanced = await tx.order.updateMany({ where: { id: order.id, status: 'PENDING_PAYMENT_VERIFICATION' }, data: { status: 'PREPARING', paidAt: now } });
    const cartId = typeof remote.metadata?.cartId === 'string' ? remote.metadata.cartId : null;
    if (cartId) {
      const variantIds = order.items.flatMap((i) => (i.variantId ? [i.variantId] : []));
      await tx.cartItem.deleteMany({ where: { cartId, variantId: { in: variantIds } } });
    }
    await queueEmail(
      {
        to: env.ORDER_NOTIFICATION_EMAIL,
        template: 'admin-card-paid',
        orderId: order.id,
        payload: {
          orderReference: order.reference,
          customerName: `${order.shipFirstName} ${order.shipLastName}`,
          amountCents,
          countryCode: order.shipCountryCode,
          adminOrderUrl: `${env.PUBLIC_SITE_URL}/admin/commandes/${order.id}`,
          providerPaymentId: remote.providerPaymentId,
          // Commande annulée dans l'admin pendant le paiement : la boutique doit rembourser depuis Mollie.
          orderCancelled: advanced.count === 0,
        },
      },
      tx,
    );
    if (advanced.count > 0) {
      await queueEmail(
        {
          to: order.email,
          template: 'order-received',
          orderId: order.id,
          payload: { orderReference: order.reference, firstName: order.shipFirstName, totalCents: order.totalCents, orderUrl: orderTrackingUrl(order), locale: order.locale, paymentMethod: 'CARD' },
        },
        tx,
      );
    }
    await logActivity({ action: 'payment.card.paid', entityType: 'Order', entityId: order.id, metadata: { reference: order.reference, amountCents, providerPaymentId: remote.providerPaymentId } }, tx);
    return true;
  });
  if (done) kickEmailQueue();
}

/**
 * Relit un paiement chez le prestataire et applique son état (webhook, retour du client, tâche de fond).
 * null = identifiant inconnu chez nous. Un paiement « payé » dont le montant, la devise ou le mode (test/réel) ne
 * correspondent pas n'est jamais validé.
 */
export async function syncCardPayment(providerPaymentId: string): Promise<CardOrderState | null> {
  const provider = getCardProvider();
  if (!provider) throw cardUnavailable();
  const payment = await prisma.payment.findUnique({ where: { providerPaymentId }, select: { id: true, status: true, amountCents: true, currency: true } });
  if (!payment) return null;
  if (payment.status === 'VERIFIED') return 'paid';
  if (payment.status === 'REJECTED') return 'failed';
  const remote = await provider.getPayment(providerPaymentId);
  if (remote.status === 'paid') {
    if (remote.amountCents !== payment.amountCents || remote.currency !== payment.currency || remote.testMode !== provider.testMode) {
      logger.error({ paymentId: payment.id, providerPaymentId }, 'Paiement carte incohérent (montant, devise ou mode test) : non validé');
      return 'pending';
    }
    await markCardPaid(payment.id, remote);
    return 'paid';
  }
  if (CARD_FAILURE_STATUSES.includes(remote.status)) {
    await closeCardOrder(payment.id, `Paiement « ${remote.status} » chez le prestataire`);
    return 'failed';
  }
  return 'pending';
}

/** Retour du client depuis la page de paiement : état du paiement (aucune donnée personnelle), relu chez Mollie si besoin. */
export async function cardOrderState(reference: string): Promise<{ reference: string; state: CardOrderState }> {
  const order = await prisma.order.findUnique({
    where: { reference },
    select: { payments: { where: { method: 'CARD' }, orderBy: { createdAt: 'desc' }, take: 1, select: { status: true, providerPaymentId: true } } },
  });
  const payment = order?.payments[0];
  if (!payment) throw notFound('Commande introuvable');
  if (payment.status === 'VERIFIED') return { reference, state: 'paid' };
  if (payment.status === 'REJECTED') return { reference, state: 'failed' };
  if (!payment.providerPaymentId) return { reference, state: 'pending' };
  return { reference, state: (await syncCardPayment(payment.providerPaymentId)) ?? 'pending' };
}

/** Tâche de fond : paiements carte restés en attente (webhook perdu ou refusé) relus chez Mollie, stock rendu s'ils ont échoué. */
export async function sweepStaleCardPayments(now = new Date()): Promise<number> {
  if (!getCardProvider()) return 0;
  const stale = await prisma.payment.findMany({
    where: { method: 'CARD', status: 'PENDING_VERIFICATION', createdAt: { lt: new Date(now.getTime() - STALE_AFTER_MS) } },
    select: { id: true, providerPaymentId: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  for (const p of stale) {
    if (p.providerPaymentId) {
      await syncCardPayment(p.providerPaymentId).catch((err) => logger.warn({ paymentId: p.id, err: (err as Error).message }, 'Paiement carte : relecture impossible'));
    } else if (p.createdAt.getTime() < now.getTime() - ORPHAN_AFTER_MS) {
      await closeCardOrder(p.id, 'Paiement jamais créé chez le prestataire');
    }
  }
  return stale.length;
}
