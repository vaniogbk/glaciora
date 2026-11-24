import { Router } from 'express';
import { z } from 'zod';
import { productQuerySchema } from '@glaciora/shared';
import { asyncHandler } from '../../lib/http';
import { currentPromotion } from '../../lib/promotions';
import * as service from './catalogue.service';
import * as packs from './packs.service';

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

/** Packs en vente (tous leurs articles publiés et en stock), prix du pack remise déduite. */
catalogueRouter.get(
  '/packs',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.json({ packs: await packs.listPacks() });
  }),
);

catalogueRouter.get(
  '/packs/:slug',
  asyncHandler(async (req, res) => {
    const slug = slugSchema.parse(req.params.slug);
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    res.json({ pack: await packs.getPack(slug) });
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

/** Promotion en cours (Black Friday…) : le site n'affiche son annonce que si elle est active ici, là où le panier l'applique. */
catalogueRouter.get(
  '/promotion',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=60');
    const promo = currentPromotion();
    res.json({ promotion: promo ? { code: promo.code, name: promo.name, percent: promo.percent, startsAt: promo.startsAt, endsAt: promo.endsAt } : null });
  }),
);
