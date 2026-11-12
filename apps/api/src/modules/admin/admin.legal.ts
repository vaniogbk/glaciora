import { Router } from 'express';
import { z } from 'zod';
import { LEGAL_FIELDS, type LegalField } from '@glaciora/shared';
import { asyncHandler } from '../../lib/http';
import { prisma } from '../../lib/prisma';
import { logActivity } from '../../lib/activity';
import { readLegalNotice } from '../legal/legal.routes';

/** Mentions légales saisies par le propriétaire : chaque champ est facultatif, une chaîne vide efface la valeur. */
export const adminLegalRouter = Router();

const field = z
  .string()
  .trim()
  .max(300, '300 caractères maximum')
  .nullish()
  .transform((v) => (v ? v : null));
const body = z.object(Object.fromEntries(LEGAL_FIELDS.map((k) => [k, field])) as Record<LegalField, typeof field>);

adminLegalRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ notice: await readLegalNotice() });
  }),
);

adminLegalRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const data = body.parse(req.body);
    await prisma.legalNotice.upsert({ where: { id: 'main' }, create: { id: 'main', ...data }, update: data });
    const filled = LEGAL_FIELDS.filter((k) => data[k]).length;
    await logActivity({ actorId: req.user!.id, actorRole: 'ADMIN', action: 'legal_notice.updated', entityType: 'LegalNotice', entityId: 'main', metadata: { filled, total: LEGAL_FIELDS.length } });
    res.json({ notice: await readLegalNotice() });
  }),
);
