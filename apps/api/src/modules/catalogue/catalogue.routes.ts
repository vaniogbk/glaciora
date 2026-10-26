import { Router } from 'express';
import { z } from 'zod';
import { productQuerySchema } from '@glaciora/shared';
import { asyncHandler } from '../../lib/http';
import * as service from './catalogue.service';

export const catalogueRouter = Router();

const slugSchema = z.string().regex(/^[a-z0-9-]{1,120}$/);

catalogueRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ categories: await service.listCategories() });
  }),
);

catalogueRouter.get(
  '/products',
  asyncHandler(async (req, res) => {
    const query = productQuerySchema.parse(req.query);
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.json(await service.listProducts(query));
  }),
);

catalogueRouter.get(
  '/products/:slug',
  asyncHandler(async (req, res) => {
    const slug = slugSchema.parse(req.params.slug);
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.json({ product: await service.getProductBySlug(slug) });
  }),
);

catalogueRouter.get(
  '/home',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json(await service.getHomeData());
  }),
);

catalogueRouter.get(
  '/sitemap',
  asyncHandler(async (_req, res) => {
    res.json(await service.sitemapEntries());
  }),
);
