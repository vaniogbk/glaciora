import { Router } from 'express';
import { z } from 'zod';
import { EUROPEAN_COUNTRIES, isValidIban, normalizeIban } from '@glaciora/shared';
import { env } from '../../config/env';
import { asyncHandler } from '../../lib/http';
import { notFound, unprocessable } from '../../lib/errors';
import { prisma } from '../../lib/prisma';
import { logActivity } from '../../lib/activity';
import { kickEmailQueue, queueEmail } from '../email/email.service';
import { maskIban } from '../payments/payment-methods';

/**
 * Comptes bancaires de réception par pays.
 * Modifier un IBAN est une opération sensible (détournement de paiements) :
 * chaque changement est journalisé (IBAN masqué) et notifié par e-mail à l'adresse de la boutique.
 */
export const adminBankRouter = Router();

const idParam = z.string().min(1).max(64);
const KNOWN_CODES = new Set(EUROPEAN_COUNTRIES.map((c) => c.code));
const EXAMPLE_IBANS = new Set(['FR7630006000011234567890189', 'DE89370400440532013000', 'GB82WEST12345698765432']);

const accountBody = z.object({
  label: z.string().trim().min(2).max(60),
  accountHolder: z.string().trim().min(2).max(70),
  iban: z
    .string()
    .trim()
    .transform(normalizeIban)
    .refine(isValidIban, 'IBAN invalide (clé de contrôle incorrecte)')
    .refine((v) => env.APP_ENV === 'development' || env.APP_ENV === 'test' || !EXAMPLE_IBANS.has(v), "IBAN d'exemple refusé"),
  bic: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'BIC invalide')
    .optional()
    .or(z.literal(''))
    .transform((v) => v || null),
  bankName: z.string().trim().max(80).optional().or(z.literal('')).transform((v) => v || null),
  countryCodes: z.array(z.string().length(2).toUpperCase()).max(60).default([]),
  isActive: z.boolean().default(true),
});

function publicAccount(a: { id: string; label: string; accountHolder: string; iban: string; bic: string | null; bankName: string | null; countryCodes: string[]; isActive: boolean; updatedAt: Date }) {
  return { ...a, ibanMasked: maskIban(a.iban) };
}

async function notifyChange(action: string, label: string, iban: string, countries: string[], actorId: string) {
  const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { firstName: true, lastName: true, email: true } });
  await queueEmail({
    to: env.ORDER_NOTIFICATION_EMAIL,
    template: 'bank-account-changed',
    payload: {
      action,
      label,
      ibanMasked: maskIban(iban),
      countries,
      actor: actor ? `${actor.firstName ?? ''} ${actor.lastName ?? ''} (${actor.email})`.trim() : 'inconnu',
      date: new Date().toISOString(),
    },
  });
  kickEmailQueue();
}

async function assertCountries(codes: string[], excludeId?: string) {
  const unknown = codes.filter((c) => !KNOWN_CODES.has(c));
  if (unknown.length) throw unprocessable('UNKNOWN_COUNTRY', `Pays inconnu(s) : ${unknown.join(', ')}`);
  const clash = await prisma.bankAccount.findFirst({
    where: { isActive: true, countryCodes: { hasSome: codes }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { label: true, countryCodes: true },
  });
  if (clash) {
    const shared = clash.countryCodes.filter((c) => codes.includes(c));
    throw unprocessable('COUNTRY_ALREADY_ASSIGNED', `Pays déjà rattaché(s) au compte « ${clash.label} » : ${shared.join(', ')}`);
  }
}

adminBankRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const accounts = await prisma.bankAccount.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({
      accounts: accounts.map(publicAccount),
      defaultAccount: env.BANK_IBAN ? { label: 'Compte principal (variables d’environnement)', accountHolder: env.BANK_ACCOUNT_HOLDER ?? '', ibanMasked: maskIban(env.BANK_IBAN), bic: env.BANK_BIC ?? null } : null,
    });
  }),
);

adminBankRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = accountBody.parse(req.body);
    if (input.isActive) await assertCountries(input.countryCodes);
    const account = await prisma.bankAccount.create({ data: input });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'bank_account.created', entityType: 'BankAccount', entityId: account.id, metadata: { label: account.label, iban: maskIban(account.iban), countries: account.countryCodes } });
    await notifyChange('Compte ajouté', account.label, account.iban, account.countryCodes, req.user!.id);
    res.status(201).json({ account: publicAccount(account) });
  }),
);

adminBankRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) throw notFound('Compte introuvable');
    const input = accountBody.partial().parse(req.body);
    const willBeActive = input.isActive ?? existing.isActive;
    if (willBeActive) await assertCountries(input.countryCodes ?? existing.countryCodes, id);
    const account = await prisma.bankAccount.update({ where: { id }, data: input });
    const ibanChanged = account.iban !== existing.iban;
    await logActivity({
      actorId: req.user!.id,
      actorRole: 'ADMIN',
      action: ibanChanged ? 'bank_account.iban_changed' : 'bank_account.updated',
      entityType: 'BankAccount',
      entityId: id,
      metadata: { label: account.label, before: maskIban(existing.iban), after: maskIban(account.iban), countries: account.countryCodes, isActive: account.isActive },
    });
    await notifyChange(ibanChanged ? 'IBAN modifié' : 'Compte modifié', account.label, account.iban, account.countryCodes, req.user!.id);
    res.json({ account: publicAccount(account) });
  }),
);

adminBankRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idParam.parse(req.params.id);
    const existing = await prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) throw notFound('Compte introuvable');
    await prisma.bankAccount.delete({ where: { id } });
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'bank_account.deleted', entityType: 'BankAccount', entityId: id, metadata: { label: existing.label, iban: maskIban(existing.iban) } });
    await notifyChange('Compte supprimé', existing.label, existing.iban, existing.countryCodes, req.user!.id);
    res.status(204).end();
  }),
);
