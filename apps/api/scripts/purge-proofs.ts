import { prisma } from '../src/lib/prisma';
import { getStorage } from '../src/modules/storage/storage';

/** Politique de conservation : supprime les justificatifs dont la date deleteAfter est dépassée. */
async function main() {
  const due = await prisma.transferProof.findMany({ where: { deletedAt: null, deleteAfter: { lt: new Date() } }, take: 500 });
  const storage = getStorage();
  let removed = 0;
  for (const proof of due) {
    await storage.remove(proof.storageKey);
    await prisma.transferProof.update({ where: { id: proof.id }, data: { deletedAt: new Date() } });
    removed++;
  }
  console.warn(`${removed} justificatif(s) supprimé(s) selon la politique de conservation.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
