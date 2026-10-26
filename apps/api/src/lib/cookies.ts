import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';

export const COOKIE = {
  access: 'glaciora_at',
  refresh: 'glaciora_rt',
  cart: 'glaciora_cart',
} as const;

const base = (): CookieOptions => ({ httpOnly: true, secure: env.COOKIE_SECURE, sameSite: 'lax', path: '/' });

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(COOKIE.access, accessToken, { ...base(), maxAge: env.ACCESS_TOKEN_TTL_SECONDS * 1000 });
  res.cookie(COOKIE.refresh, refreshToken, {
    ...base(),
    sameSite: 'strict',
    path: '/api/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(COOKIE.access, base());
  res.clearCookie(COOKIE.refresh, { ...base(), sameSite: 'strict', path: '/api/auth' });
}

export function setCartCookie(res: Response, token: string, maxAgeMs: number) {
  res.cookie(COOKIE.cart, token, { ...base(), maxAge: maxAgeMs });
}
