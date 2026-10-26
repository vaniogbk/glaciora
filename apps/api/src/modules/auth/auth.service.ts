import { randomUUID } from 'node:crypto';
import type { User } from '@prisma/client';
import { env } from '../../config/env';
import { AppError, unauthorized } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { generateOpaqueToken, hashToken, signAccessToken } from '../../lib/tokens';
import { logActivity } from '../../lib/activity';
import { kickEmailQueue, queueEmail } from '../email/email.service';
import { burnPasswordCheck, hashPassword, verifyPassword } from './password';

export const MAX_FAILED_LOGINS = 5;
export const LOCK_MINUTES = 15;
const RESET_TTL_MINUTES = 30;

const INVALID_CREDENTIALS = 'Adresse e-mail ou mot de passe incorrect';

export function publicUser(user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'>) {
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
}

async function issueTokens(user: Pick<User, 'id' | 'role'>, familyId: string = randomUUID()) {
  const refreshToken = generateOpaqueToken(48);
  const record = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000),
    },
  });
  return { accessToken: signAccessToken({ sub: user.id, role: user.role }), refreshToken, refreshId: record.id };
}

/**
 * Inscription. Réponse identique que l'adresse soit libre ou déjà utilisée (pas d'énumération) :
 * le client se connecte ensuite avec ses identifiants.
 */
export async function register(input: { email: string; password: string; firstName: string; lastName: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) {
    await burnPasswordCheck(input.password);
    return;
  }
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });
  await logActivity({ actorId: user.id, actorRole: 'CLIENT', action: 'user.registered', entityType: 'User', entityId: user.id });
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    await burnPasswordCheck(password);
    throw unauthorized(INVALID_CREDENTIALS);
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await burnPasswordCheck(password);
    throw unauthorized(INVALID_CREDENTIALS);
  }
  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    const failed = user.failedLoginCount + 1;
    const lock = failed >= MAX_FAILED_LOGINS;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: lock ? 0 : failed, lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null },
    });
    if (lock) await logActivity({ actorId: user.id, action: 'auth.locked', entityType: 'User', entityId: user.id });
    throw unauthorized(INVALID_CREDENTIALS);
  }
  await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
  if (user.role === 'ADMIN') await logActivity({ actorId: user.id, actorRole: 'ADMIN', action: 'auth.admin_login', entityType: 'User', entityId: user.id });
  const tokens = await issueTokens(user);
  return { user: publicUser(user), ...tokens };
}

/** Rotation du refresh token, avec détection de réutilisation (vol présumé → famille révoquée). */
export async function refresh(refreshToken: string | undefined) {
  if (!refreshToken || refreshToken.length > 200) throw unauthorized('Session expirée');
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(refreshToken) }, include: { user: true } });
  if (!record) throw unauthorized('Session expirée');
  if (record.revokedAt) {
    await prisma.refreshToken.updateMany({ where: { familyId: record.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
    await logActivity({ actorId: record.userId, action: 'auth.refresh_reuse_detected', entityType: 'User', entityId: record.userId });
    throw unauthorized('Session expirée');
  }
  if (record.expiresAt < new Date() || !record.user.isActive) throw unauthorized('Session expirée');
  const tokens = await issueTokens(record.user, record.familyId);
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: new Date(), replacedBy: tokens.refreshId } });
  return { user: publicUser(record.user), ...tokens };
}

export async function logout(refreshToken: string | undefined) {
  if (!refreshToken || refreshToken.length > 200) return;
  await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
}

/** Toujours la même réponse ; un e-mail n'est envoyé que si le compte existe. */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, isActive: true } });
  if (!user || !user.isActive) return;
  const token = generateOpaqueToken(32);
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
    await tx.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000) },
    });
    await queueEmail(
      {
        to: email,
        template: 'password-reset',
        payload: { resetUrl: `${env.PUBLIC_SITE_URL}/compte/reinitialiser?token=${encodeURIComponent(token)}`, expiresInMinutes: RESET_TTL_MINUTES },
      },
      tx,
    );
  });
  kickEmailQueue();
}

export async function resetPassword(token: string, password: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'Lien invalide ou expiré. Faites une nouvelle demande.');
  }
  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash, failedLoginCount: 0, lockedUntil: null } }),
    prisma.refreshToken.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  await logActivity({ actorId: record.userId, action: 'auth.password_reset', entityType: 'User', entityId: record.userId });
}
