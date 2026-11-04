import { z } from 'zod';
import { prisma } from '../src/lib/prisma';
import { logActivity } from '../src/lib/activity';

/**
 * npx tsx scripts/change-user-email.ts <ancienne-adresse> <nouvelle-adresse>
 * Change l'identifiant de connexion d'un compte (le mot de passe ne change pas). Refuse si la nouvelle adresse est déjà prise.
 */
const email = z.string().trim().toLowerCase().email();

async function main() {
  const [from, to] = [email.parse(process.argv[2]), email.parse(process.argv[3])];
  if (from === to) throw new Error('Les deux adresses sont identiques');
  const user = await prisma.user.findUnique({ where: { email: from }, select: { id: true, role: true } });
  if (!user) throw new Error(`Aucun compte ${from}`);
  if (await prisma.user.findUnique({ where: { email: to }, select: { id: true } })) throw new Error(`Un compte ${to} existe déjà`);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { email: to } });
    await logActivity({ action: 'user.email_changed', entityType: 'User', entityId: user.id, metadata: { role: user.role, by: 'script' } }, tx);
  });
  console.warn(`Compte ${user.role} : identifiant ${from} → ${to}. Mot de passe inchangé.`);
}

main()
  .catch((err) => {
    console.error(`Échec : ${(err as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
