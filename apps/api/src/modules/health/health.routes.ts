import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { asyncHandler } from '../../lib/http';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    let database: 'ok' | 'down' = 'ok';
    try {
      // Vérifie la connexion ET la présence du schéma (table des migrations Prisma).
      await prisma.$queryRaw`SELECT 1 FROM "_prisma_migrations" LIMIT 1`;
    } catch {
      database = 'down';
    }
    res.status(database === 'ok' ? 200 : 503).json({ status: database === 'ok' ? 'ok' : 'degraded', database });
  }),
);
