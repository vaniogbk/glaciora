import { randomUUID } from 'node:crypto';
import { env } from '../src/config/env';
import { getStorage } from '../src/modules/storage/storage';

/**
 * npx tsx scripts/check-storage.ts
 * Vérifie le stockage privé des justificatifs : écriture, relecture, suppression,
 * et (R2) refus d'une lecture anonyme de l'objet.
 */
async function main() {
  const storage = getStorage();
  const key = `healthcheck/${randomUUID()}.txt`;
  const body = Buffer.from(`GLACIORA storage check ${new Date().toISOString()}`);
  await storage.put(key, body, 'text/plain');
  const read = await storage.get(key);
  if (!read.equals(body)) throw new Error('Contenu relu différent du contenu écrit');
  console.warn(`Pilote « ${storage.driver} » : écriture et relecture OK.`);

  if (storage.driver === 'r2') {
    const anonymous = await fetch(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`);
    if (anonymous.ok) throw new Error('ALERTE : objet lisible sans authentification (bucket public ?)');
    console.warn(`Lecture anonyme refusée (HTTP ${anonymous.status}) : bucket privé.`);
  }

  await storage.remove(key);
  console.warn('Suppression OK. Stockage opérationnel.');
}

main().catch((err) => {
  console.error(`Échec du contrôle de stockage : ${(err as Error).message}`);
  process.exitCode = 1;
});
