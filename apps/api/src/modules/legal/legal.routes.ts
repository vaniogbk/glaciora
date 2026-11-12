import { Router } from 'express';
import { LEGAL_FIELDS, type LegalNoticeData } from '@glaciora/shared';
import { asyncHandler } from '../../lib/http';
import { prisma } from '../../lib/prisma';

/** Mentions légales publiques (lecture seule). Champs non saisis : null. */
export const legalRouter = Router();

export async function readLegalNotice(): Promise<LegalNoticeData> {
  const row = await prisma.legalNotice.findUnique({ where: { id: 'main' } });
  const fields = Object.fromEntries(LEGAL_FIELDS.map((k) => [k, row?.[k] ?? null])) as Record<(typeof LEGAL_FIELDS)[number], string | null>;
  return { ...fields, updatedAt: row?.updatedAt.toISOString() ?? null };
}

legalRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ notice: await readLegalNotice() });
  }),
);
