import { createHash, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import QRCode from 'qrcode';
import { Prisma } from '@prisma/client';
import {
  PROOF_ERROR_MESSAGES,
  buildEpcQrPayload,
  checkoutSchema,
  quoteShipping,
  selectShippingQuote,
  validateProofFile,
  type CheckoutInput,
} from '@glaciora/shared';
import { env } from '../../config/env';
import { AppError, badRequest, conflict, notFound, unprocessable } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { generateOpaqueToken, hashToken, safeEqual } from '../../lib/tokens';
import { logActivity } from '../../lib/activity';
import { findCurrentCart, loadCartItems, toCartView } from '../cart/cart.service';
import { loadShippingZones } from '../shipping/shipping.repository';
import { maskIban, resolveReceivingAccount } from '../payments/payment-methods';
import { getStorage } from '../storage/storage';
import { kickEmailQueue, queueEmail } from '../email/email.service';
import { REFERENCE_COOKIE, REFERENCE_TTL_MS, decodeReference, encodeReference, newReference } from './checkout-reference';

export const ORDER_ACCESS_COOKIE = 'glaciora_order';

async function requireCart(req: Request) {
  const cart = await findCurrentCart(req);
  if (!cart) throw unprocessable('EMPTY_CART', 'Votre panier est vide');
  return cart;
}

export async function quoteForCurrentCart(req: Request, countryCode: string) {
  const cart = await findCurrentCart(req);
  const view = toCartView(cart ? await loadCartItems(cart.id) : []);
  const zones = await loadShippingZones();
  return { subtotalCents: view.subtotalCents, quotes: quoteShipping(zones, countryCode, view.subtotalCents) };
}

/** Étape « virement » : montant définitif, référence réservée, coordonnées et QR code SEPA. */
export async function preparePaymentDetails(req: Request, res: Response, countryCode: string, shippingRateId: string) {
  const account = await resolveReceivingAccount(countryCode);
  if (!account) throw new AppError(503, 'BANK_NOT_CONFIGURED', 'Le paiement par virement est momentanément indisponible pour ce pays');
  const bank = { accountHolder: account.accountHolder, iban: account.iban, bic: account.bic, bankName: account.bankName };
  const cart = await requireCart(req);
  const view = toCartView(await loadCartItems(cart.id));
  if (view.items.length === 0) throw unprocessable('EMPTY_CART', 'Votre panier est vide');
  if (view.hasIssues) throw unprocessable('CART_ISSUES', 'Certains articles ne sont plus disponibles', view.items.filter((i) => i.issue));
  const quote = selectShippingQuote(await loadShippingZones(), countryCode, view.subtotalCents, shippingRateId);
  if (!quote) throw unprocessable('SHIPPING_UNAVAILABLE', 'Livraison indisponible pour ce pays');

  const amountCents = view.subtotalCents + quote.priceCents;
  const previous = decodeReference(req.cookies?.[REFERENCE_COOKIE] as string | undefined);
  const reference = previous?.reference ?? newReference();
  const expiresAt = Date.now() + REFERENCE_TTL_MS;
  res.cookie(REFERENCE_COOKIE, encodeReference(reference, amountCents, expiresAt), {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: '/api/checkout',
    maxAge: REFERENCE_TTL_MS,
  });

  const payload = buildEpcQrPayload({
    beneficiaryName: bank.accountHolder,
    iban: bank.iban,
    bic: bank.bic ?? undefined,
    amountCents,
    remittanceText: reference,
  });
  const svg = await QRCode.toString(payload, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 });
  return {
    reference,
    amountCents,
    subtotalCents: view.subtotalCents,
    shippingCents: quote.priceCents,
    shippingRateName: quote.name,
    currency: 'EUR',
    bank,
    qrCodeDataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
  };
}

export interface UploadedProof {
  buffer: Buffer;
  size: number;
  originalname: string;
  mimetype: string;
}

export async function placeBankTransferOrder(req: Request, res: Response, rawData: unknown, file: UploadedProof | undefined) {
  let data: CheckoutInput;
  try {
    data = checkoutSchema.parse(typeof rawData === 'string' ? JSON.parse(rawData) : rawData);
  } catch (err) {
    if (err instanceof SyntaxError) throw badRequest('Données de commande illisibles');
    throw err;
  }
  if (!file) throw unprocessable('PROOF_REQUIRED', 'La confirmation de virement est obligatoire');
  const check = validateProofFile({
    bytes: file.buffer.subarray(0, 16),
    sizeBytes: file.size,
    originalName: file.originalname,
    declaredMime: file.mimetype,
    maxBytes: env.UPLOAD_MAX_BYTES,
  });
  if (!check.ok) throw unprocessable(`PROOF_${check.error}`, PROOF_ERROR_MESSAGES[check.error]);

  const signed = decodeReference(req.cookies?.[REFERENCE_COOKIE] as string | undefined);
  if (!signed) throw conflict('Référence de virement expirée : affichez à nouveau les coordonnées bancaires', { code: 'REFERENCE_EXPIRED' });
  const cart = await requireCart(req);

  const now = new Date();
  const storageKey = `proofs/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${check.extension}`;
  const storage = getStorage();
  await storage.put(storageKey, file.buffer, check.mime);

  const accessToken = generateOpaqueToken();
  try {
    const order = await prisma.$transaction(async (tx) => {
      const items = await loadCartItems(cart.id, tx);
      const view = toCartView(items);
      if (view.items.length === 0) throw unprocessable('EMPTY_CART', 'Votre panier est vide');
      if (view.hasIssues) throw unprocessable('CART_ISSUES', 'Certains articles ne sont plus disponibles', view.items.filter((i) => i.issue));
      const zones = await loadShippingZones(tx);
      const quote = selectShippingQuote(zones, data.shippingAddress.countryCode, view.subtotalCents, data.shippingRateId);
      if (!quote) throw unprocessable('SHIPPING_UNAVAILABLE', 'Livraison indisponible pour ce pays');
      const totalCents = view.subtotalCents + quote.priceCents;
      const account = await resolveReceivingAccount(data.shippingAddress.countryCode);
      if (!account) throw new AppError(503, 'BANK_NOT_CONFIGURED', 'Le paiement par virement est momentanément indisponible pour ce pays');
      if (totalCents !== signed.amountCents) {
        throw conflict('Le montant de la commande a changé : vérifiez le nouveau montant avant de valider', { code: 'AMOUNT_CHANGED', totalCents });
      }

      // Réservation du stock : décrément conditionnel, aucune survente possible même en concurrence.
      for (const item of items) {
        const updated = await tx.stock.updateMany({
          where: { variantId: item.variantId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw unprocessable('INSUFFICIENT_STOCK', `Stock insuffisant pour « ${item.variant.product.name} »`);
        }
      }

      const a = data.shippingAddress;
      const created = await tx.order.create({
        data: {
          reference: signed.reference,
          userId: req.user?.id ?? null,
          email: data.email,
          shipFirstName: a.firstName,
          shipLastName: a.lastName,
          shipCompany: a.company || null,
          shipLine1: a.line1,
          shipLine2: a.line2 || null,
          shipPostalCode: a.postalCode,
          shipCity: a.city,
          shipRegion: a.region || null,
          shipCountryCode: a.countryCode,
          shipPhone: a.phone,
          subtotalCents: view.subtotalCents,
          shippingCents: quote.priceCents,
          totalCents,
          shippingRateName: quote.name,
          customerNote: data.customerNote || null,
          accessTokenHash: hashToken(accessToken),
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              productName: item.variant.product.name,
              productReference: item.variant.product.reference,
              productSlug: item.variant.product.slug,
              variantSku: item.variant.sku,
              sizeLabel: item.variant.size?.label ?? null,
              color: item.variant.color,
              imageUrl: item.variant.product.images[0]?.url ?? null,
              unitPriceCents: item.variant.priceCents,
              quantity: item.quantity,
              lineTotalCents: item.variant.priceCents * item.quantity,
            })),
          },
          payments: {
            create: {
              method: 'BANK_TRANSFER',
              amountCents: totalCents,
              transferReference: signed.reference,
              bankAccountId: account.bankAccountId,
              receivingAccount: `${account.label} — ${maskIban(account.iban)}`,
            },
          },
        },
        include: { payments: true },
      });

      await tx.stockMovement.createMany({
        data: items.map((item) => ({ variantId: item.variantId, type: 'ORDER_RESERVE' as const, delta: -item.quantity, orderId: created.id })),
      });

      await tx.transferProof.create({
        data: {
          orderId: created.id,
          paymentId: created.payments[0]?.id,
          storageDriver: storage.driver,
          storageKey,
          originalName: check.safeName,
          mimeType: check.mime,
          sizeBytes: file.size,
          sha256: createHash('sha256').update(file.buffer).digest('hex'),
          deleteAfter: new Date(Date.now() + env.PROOF_RETENTION_DAYS * 24 * 3600 * 1000),
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      await queueEmail(
        {
          to: env.ORDER_NOTIFICATION_EMAIL,
          template: 'admin-transfer-proof',
          orderId: created.id,
          payload: {
            orderReference: created.reference,
            customerName: `${a.firstName} ${a.lastName}`,
            amountCents: totalCents,
            countryCode: a.countryCode,
            adminOrderUrl: `${env.PUBLIC_SITE_URL}/admin/commandes/${created.id}`,
            proofCount: 1,
          },
        },
        tx,
      );
      await queueEmail(
        {
          to: data.email,
          template: 'order-received',
          orderId: created.id,
          payload: {
            orderReference: created.reference,
            firstName: a.firstName,
            totalCents,
            orderUrl: req.user ? `${env.PUBLIC_SITE_URL}/compte/commandes/${created.reference}` : `${env.PUBLIC_SITE_URL}/commande/confirmation?ref=${created.reference}`,
          },
        },
        tx,
      );
      await logActivity(
        { actorId: req.user?.id, actorRole: req.user?.role, action: 'order.created', entityType: 'Order', entityId: created.id, metadata: { reference: created.reference, totalCents } },
        tx,
      );
      return created;
    });

    res.clearCookie(REFERENCE_COOKIE, { path: '/api/checkout' });
    res.cookie(ORDER_ACCESS_COOKIE, `${order.reference}.${accessToken}`, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: 'lax',
      path: '/api/checkout',
      maxAge: 30 * 24 * 3600 * 1000,
    });
    kickEmailQueue();
    return { reference: order.reference, totalCents: order.totalCents, status: order.status };
  } catch (err) {
    await storage.remove(storageKey).catch(() => undefined);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      res.clearCookie(REFERENCE_COOKIE, { path: '/api/checkout' });
      throw conflict('Cette référence a déjà été utilisée : rechargez la page de paiement', { code: 'REFERENCE_USED' });
    }
    throw err;
  }
}

/** Récapitulatif de commande pour la page de confirmation (propriétaire connecté ou jeton invité). */
export async function getOrderConfirmation(req: Request, reference: string) {
  const order = await prisma.order.findUnique({
    where: { reference },
    include: { items: true, payments: { select: { method: true, status: true, amountCents: true } }, proofs: { select: { id: true } } },
  });
  if (!order) throw notFound('Commande introuvable');
  const cookie = req.cookies?.[ORDER_ACCESS_COOKIE] as string | undefined;
  const [cookieRef, token] = cookie?.split('.') ?? [];
  const ownsByToken = cookieRef === reference && token && order.accessTokenHash && safeEqual(hashToken(token), order.accessTokenHash);
  const ownsByAccount = req.user && order.userId === req.user.id;
  if (!ownsByToken && !ownsByAccount) throw notFound('Commande introuvable');
  return {
    reference: order.reference,
    status: order.status,
    createdAt: order.createdAt,
    email: order.email,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    shippingRateName: order.shippingRateName,
    shipCountryCode: order.shipCountryCode,
    shipCity: order.shipCity,
    items: order.items.map((i) => ({
      productName: i.productName,
      productSlug: i.productSlug,
      sizeLabel: i.sizeLabel,
      quantity: i.quantity,
      unitPriceCents: i.unitPriceCents,
      lineTotalCents: i.lineTotalCents,
      imageUrl: i.imageUrl,
    })),
    payment: order.payments[0] ?? null,
    proofReceived: order.proofs.length > 0,
  };
}
