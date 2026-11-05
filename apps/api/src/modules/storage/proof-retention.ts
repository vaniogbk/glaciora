import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { getStorage } from './storage';

/**
 * Politique de conservation (RGPD) : supprime du stockage privé les preuves de virement dont la date deleteAfter
 * (dépôt + PROOF_RETENTION_DAYS) est dépassée, et le note en base. Un fichier en échec est retenté au passage suivant.
 */
export async function purgeExpiredProofs(now = new Date()): Promise<{ removed: number; failed: number }> {
  const due = await prisma.transferProof.findMany({ where: { deletedAt: null, deleteAfter: { lt: now } }, take: 500, select: { id: true, storageKey: true } });
  const storage = getStorage();
  let removed = 0;
  let failed = 0;
  for (const proof of due) {
    try {
      await storage.remove(proof.storageKey);
      await prisma.transferProof.update({ where: { id: proof.id }, data: { deletedAt: new Date() } });
      removed++;
    } catch (err) {
      failed++;
      logger.warn({ proofId: proof.id, err: (err as Error).message }, 'Purge de justificatif : échec, nouvel essai au prochain passage');
    }
  }
  if (removed || failed) logger.info({ removed, failed }, 'Purge des justificatifs expirés');
  return { removed, failed };
}
