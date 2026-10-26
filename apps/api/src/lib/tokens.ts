import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env';

const ISSUER = 'glaciora-api';
const AUDIENCE = 'glaciora-web';

export interface AccessClaims {
  sub: string;
  role: Role;
}

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign({ role: claims.role }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: claims.sub,
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function verifyAccessToken(token: string): AccessClaims | null {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE });
    if (typeof payload === 'string' || !payload.sub) return null;
    const role = (payload as { role?: unknown }).role;
    if (role !== 'CLIENT' && role !== 'ADMIN') return null;
    return { sub: payload.sub, role };
  } catch {
    return null;
  }
}

/** Jeton opaque aléatoire (refresh, panier, réinitialisation, accès invité). */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Empreinte stockée en base : le jeton en clair n'est jamais enregistré. HMAC pour lier au secret serveur. */
export function hashToken(token: string): string {
  return createHash('sha256').update(`${env.JWT_REFRESH_SECRET}:${token}`).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}
