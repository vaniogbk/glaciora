import type { Prisma, Role } from '@prisma/client';
import { prisma } from './prisma';
import { logger } from './logger';

export interface ActivityInput {
  actorId?: string | null;
  actorRole?: Role | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  /** Métadonnées non personnelles uniquement (identifiants, statuts, compteurs). */
  metadata?: Prisma.InputJsonValue;
}

export async function logActivity(input: ActivityInput, tx: Prisma.TransactionClient = prisma): Promise<void> {
  try {
    await tx.activityLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata,
      },
    });
  } catch (err) {
    logger.warn({ action: input.action, err: (err as Error).message }, "Journal d'activité non enregistré");
  }
}
