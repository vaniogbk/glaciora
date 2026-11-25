import express, { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/http';
import { syncCardPayment } from '../checkout/card-checkout';

export const paymentsRouter = Router();

const molliePaymentId = z.string().regex(/^tr_[A-Za-z0-9]{4,40}$/);

/**
 * Webhook Mollie : le corps ne contient que l'identifiant du paiement (id=tr_…). Rien n'y est cru : le paiement est relu
 * chez Mollie avec notre clé. Réponse 200 aussi pour un identifiant inconnu (rien à révéler) ; une erreur (Mollie
 * injoignable) renvoie 5xx et Mollie rappelle plus tard.
 */
paymentsRouter.post(
  '/mollie/webhook',
  express.urlencoded({ extended: false, limit: '2kb' }),
  asyncHandler(async (req, res) => {
    const id = molliePaymentId.safeParse((req.body as Record<string, unknown> | undefined)?.id);
    if (id.success) await syncCardPayment(id.data);
    res.status(200).end();
  }),
);
