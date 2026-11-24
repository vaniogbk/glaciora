import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { allowedOrigins, env } from '../config/env';
import { forbidden } from '../lib/errors';
import { safeEqual } from '../lib/tokens';

export const CSRF_HEADER = 'x-glaciora-csrf';
export const PROXY_HEADER = 'x-glaciora-proxy';

/**
 * L'API n'est appelée que par le site (proxy Vercel et rendu serveur). Avec un secret configuré, une requête qui ne le porte pas
 * (appel direct à l'adresse Railway) est refusée : elle ne peut donc plus falsifier X-Forwarded-For pour contourner les limites
 * par IP. Le contrôle de santé reste ouvert. Sans secret, rien n'est bloqué (développement, tests, déploiement progressif).
 */
export function createProxyGuard(secret: string | undefined): RequestHandler {
  return (req, _res, next) => {
    if (!secret || req.path === '/api/health') return next();
    const provided = req.get(PROXY_HEADER);
    if (provided && safeEqual(provided, secret)) return next();
    next(forbidden('Accès direct à l’API refusé'));
  };
}

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

/** Rendu serveur du site (Vercel) : porte le secret partagé, que les navigateurs ne connaissent jamais. */
export const SSR_HEADER = 'x-glaciora-ssr';

/**
 * Requête du rendu serveur du site (pages préparées par Vercel), et non d'un visiteur. Sans ce repère, toutes ces requêtes
 * viendraient de quelques adresses IP de Vercel et partageraient la même limite par IP : sous un fort trafic, l'API les
 * refuserait et des fiches produit s'afficheraient « introuvables ». Le site retire cet en-tête des requêtes des navigateurs.
 */
export function isServerRender(header: string | undefined, secret: string | undefined = env.PROXY_SECRET): boolean {
  return Boolean(secret && header && safeEqual(header, secret));
}

function limiter(windowMs: number, limit: number, message: string, options: { exemptServerRender?: boolean } = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => isTest || (options.exemptServerRender === true && isServerRender(req.get(SSR_HEADER))),
    message: { error: { code: 'TOO_MANY_REQUESTS', message } },
  });
}

// Limite générale par adresse IP, large : sur mobile, des centaines d'abonnés partagent une même adresse (CGNAT des
// opérateurs). Les écritures sensibles gardent leurs limites strictes ci-dessous. Le rendu serveur du site n'est pas compté.
export const globalLimiter = limiter(15 * 60 * 1000, 3000, 'Trop de requêtes, réessayez dans quelques minutes.', { exemptServerRender: true });
export const authLimiter = limiter(15 * 60 * 1000, 20, 'Trop de tentatives, réessayez dans 15 minutes.');
export const passwordResetLimiter = limiter(60 * 60 * 1000, 5, 'Trop de demandes, réessayez plus tard.');
export const checkoutLimiter = limiter(60 * 60 * 1000, 60, 'Trop de commandes en peu de temps, réessayez plus tard.');
/** Suivi de commande par référence (sans compte) : freine la recherche de références au hasard. */
export const trackingLimiter = limiter(15 * 60 * 1000, 60, 'Trop de recherches de commande, réessayez dans quelques minutes.');
export const uploadLimiter = limiter(60 * 60 * 1000, 20, "Trop d'envois de fichiers, réessayez plus tard.");
