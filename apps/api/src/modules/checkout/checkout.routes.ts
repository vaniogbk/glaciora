import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { PROOF_MIME_TYPES } from '@glaciora/shared';
import { env } from '../../config/env';
import { asyncHandler } from '../../lib/http';
import { checkoutLimiter, uploadLimiter } from '../../middlewares/security';
import { listShippableCountries } from '../shipping/shipping.repository';
import { listPaymentMethods } from '../payments/payment-methods';
import * as checkout from './checkout.service';

export const checkoutRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_BYTES, files: 1, fields: 4, fieldSize: 20_000, parts: 6 },
});

const countrySchema = z.string().regex(/^[A-Za-z]{2}$/).transform((v) => v.toUpperCase());

checkoutRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

checkoutRouter.get(
  '/config',
  asyncHandler(async (_req, res) => {
    res.json({
      countries: await listShippableCountries(),
      paymentMethods: await listPaymentMethods(),
      upload: { maxBytes: env.UPLOAD_MAX_BYTES, mimeTypes: PROOF_MIME_TYPES },
    });
  }),
);

checkoutRouter.get(
  '/shipping-quotes',
  asyncHandler(async (req, res) => {
    const country = countrySchema.parse(req.query.country);
    res.json(await checkout.quoteForCurrentCart(req, country));
  }),
);

checkoutRouter.post(
  '/payment-details',
  checkoutLimiter,
  asyncHandler(async (req, res) => {
    const body = z.object({ countryCode: countrySchema, shippingRateId: z.string().min(1).max(64) }).parse(req.body);
    res.json(await checkout.preparePaymentDetails(req, res, body.countryCode, body.shippingRateId));
  }),
);

checkoutRouter.post(
  '/orders',
  checkoutLimiter,
  uploadLimiter,
  upload.single('proof'),
  asyncHandler(async (req, res) => {
    const result = await checkout.placeBankTransferOrder(req, res, req.body?.data, req.file);
    res.status(201).json({ order: result });
  }),
);

checkoutRouter.get(
  '/orders/:reference',
  asyncHandler(async (req, res) => {
    const reference = z.string().regex(/^GLA-\d{6}-[A-Z0-9]{5}$/).parse(req.params.reference);
    res.json({ order: await checkout.getOrderConfirmation(req, reference) });
  }),
);
