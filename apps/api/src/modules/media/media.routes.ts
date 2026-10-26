import { Router } from 'express';
import { asyncHandler } from '../../lib/http';
import { notFound } from '../../lib/errors';
import { getStorage } from '../storage/storage';

/** Images produits ajoutées depuis l'admin. Seul le préfixe media/ est exposé (jamais les justificatifs). */
export const mediaRouter = Router();

mediaRouter.get(
  '/products/:file',
  asyncHandler(async (req, res) => {
    const file = req.params.file ?? '';
    if (!/^[a-f0-9-]{36}\.webp$/.test(file)) throw notFound();
    let body: Buffer;
    try {
      body = await getStorage().get(`media/products/${file}`);
    } catch {
      throw notFound();
    }
    res.set({ 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable', 'Cross-Origin-Resource-Policy': 'cross-origin' });
    res.send(body);
  }),
);
