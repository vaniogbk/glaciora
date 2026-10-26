import { Router } from 'express';
import { z } from 'zod';
import { cartItemSchema } from '@glaciora/shared';
import { asyncHandler } from '../../lib/http';
import * as cart from './cart.service';

export const cartRouter = Router();

const variantParam = z.string().min(1).max(64);
const quantityBody = z.object({ quantity: cartItemSchema.shape.quantity });

cartRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

cartRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ cart: await cart.getCartView(req) });
  }),
);

cartRouter.post(
  '/items',
  asyncHandler(async (req, res) => {
    const body = cartItemSchema.parse(req.body);
    res.status(201).json({ cart: await cart.addItem(req, res, body.variantId, body.quantity) });
  }),
);

cartRouter.patch(
  '/items/:variantId',
  asyncHandler(async (req, res) => {
    const variantId = variantParam.parse(req.params.variantId);
    const { quantity } = quantityBody.parse(req.body);
    res.json({ cart: await cart.updateItem(req, variantId, quantity) });
  }),
);

cartRouter.delete(
  '/items/:variantId',
  asyncHandler(async (req, res) => {
    const variantId = variantParam.parse(req.params.variantId);
    res.json({ cart: await cart.removeItem(req, variantId) });
  }),
);
