import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { allowedOrigins, env } from '../config/env';
import { forbidden } from '../lib/errors';

export const CSRF_HEADER = 'x-glaciora-csrf';

export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.get('x-request-id');
  req.requestId = incoming && /^[a-zA-Z0-9-]{8,64}$/.test(incoming) ? incoming : randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
};

/**
 * Protection CSRF pour les requêtes qui modifient des données :
 * 1. en-tête personnalisé obligatoire (un formulaire ou une image tierce ne peut pas l'ajouter,
 *    et l'API n'active pas CORS, donc un script tiers non plus) ;
 * 2. si le navigateur envoie Origin (ou Referer), il doit appartenir aux origines autorisées.
 * Les cookies sont en plus SameSite=Lax/Strict.
 */
export const csrfGuard: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get(CSRF_HEADER) !== '1') return next(forbidden('Requête refusée (protection CSRF)'));
  const origin = req.get('origin') ?? refererOrigin(req.get('referer'));
  if (origin && !allowedOrigins.includes(origin)) return next(forbidden('Origine non autorisée'));
  next();
};

function refererOrigin(referer?: string): string | undefined {
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return 'invalid';
  }
}

const isTest = env.NODE_ENV === 'test';

function limiter(windowMs: number, limit: number, message: string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => isTest,
    message: { error: { code: 'TOO_MANY_REQUESTS', message } },
  });
}

export const globalLimiter = limiter(15 * 60 * 1000, 600, 'Trop de requêtes, réessayez dans quelques minutes.');
export const authLimiter = limiter(15 * 60 * 1000, 20, 'Trop de tentatives, réessayez dans 15 minutes.');
export const passwordResetLimiter = limiter(60 * 60 * 1000, 5, 'Trop de demandes, réessayez plus tard.');
export const checkoutLimiter = limiter(60 * 60 * 1000, 30, 'Trop de commandes en peu de temps, réessayez plus tard.');
export const uploadLimiter = limiter(60 * 60 * 1000, 20, "Trop d'envois de fichiers, réessayez plus tard.");
