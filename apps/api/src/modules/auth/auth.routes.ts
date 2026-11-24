import { Router } from 'express';
import { loginSchema, resetConfirmSchema, resetRequestSchema } from '@glaciora/shared';
import { AppError } from '../../lib/errors';
import { asyncHandler } from '../../lib/http';
import { COOKIE, clearAuthCookies, setAuthCookies } from '../../lib/cookies';
import { prisma } from '../../lib/prisma';
import { authLimiter, passwordResetLimiter } from '../../middlewares/security';
import { attachCartToUser } from '../cart/cart.service';
import * as auth from './auth.service';

export const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Plus de comptes clients (décision de la boutique, 2026-11-24) : la commande et son suivi se font avec la référence
// de commande. Seuls les comptes administrateurs existants se connectent encore.
authRouter.post('/register', authLimiter, (_req, _res, next) => {
  next(new AppError(410, 'REGISTRATION_CLOSED', 'Aucun compte n’est nécessaire : suivez votre commande avec sa référence.'));
});

authRouter.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await auth.login(email, password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    await attachCartToUser(req, result.user.id);
    res.json({ user: result.user });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    try {
      const result = await auth.refresh(req.cookies?.[COOKIE.refresh] as string | undefined);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({ user: result.user });
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await auth.logout(req.cookies?.[COOKIE.refresh] as string | undefined);
    clearAuthCookies(res);
    res.status(204).end();
  }),
);

authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    if (!req.user) {
      res.json({ user: null });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
    res.json({ user: user && user.isActive ? auth.publicUser(user) : null });
  }),
);

authRouter.post(
  '/password/forgot',
  passwordResetLimiter,
  asyncHandler(async (req, res) => {
    const { email, locale } = resetRequestSchema.parse(req.body);
    await auth.requestPasswordReset(email, locale);
    res.status(202).json({ message: 'Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé.' });
  }),
);

authRouter.post(
  '/password/reset',
  passwordResetLimiter,
  asyncHandler(async (req, res) => {
    const { token, password } = resetConfirmSchema.parse(req.body);
    await auth.resetPassword(token, password);
    clearAuthCookies(res);
    res.json({ message: 'Mot de passe modifié. Vous pouvez vous connecter.' });
  }),
);
