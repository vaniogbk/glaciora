import type { RequestHandler } from 'express';
import { COOKIE } from '../lib/cookies';
import { forbidden, unauthorized } from '../lib/errors';
import { prisma } from '../lib/prisma';
import { verifyAccessToken } from '../lib/tokens';

/** Lit le jeton d'accès (cookie httpOnly, ou en-tête Bearer pour les outils) sans exiger de session. */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const header = req.get('authorization');
  const token = (req.cookies?.[COOKIE.access] as string | undefined) ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (token) {
    const claims = verifyAccessToken(token);
    if (claims) req.user = { id: claims.sub, role: claims.role };
  }
  next();
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  next();
};

/**
 * Accès admin : le rôle du jeton ne suffit pas, il est revérifié en base à chaque requête
 * (compte désactivé ou rétrogradé = accès coupé immédiatement).
 */
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.user) return next(unauthorized());
    if (req.user.role !== 'ADMIN') return next(forbidden());
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true, isActive: true } });
    if (!user || !user.isActive || user.role !== 'ADMIN') return next(forbidden());
    next();
  } catch (err) {
    next(err);
  }
};
