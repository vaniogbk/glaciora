import path from 'node:path';
import { env } from '../src/config/env';
import { prisma } from '../src/lib/prisma';
import { runCatalogueImport } from '../src/modules/catalogue-import/import.service';
import { hashPassword } from '../src/modules/auth/password';

/**
 * Base de TEST uniquement (refuse de tourner ailleurs) : catalogue réel importé,
 * puis stock [TEST] de 5 unités par variante active et compte admin de test.
 */
async function main() {
  if (env.APP_ENV !== 'test' || !/glaciora_test/.test(env.DATABASE_URL)) {
    throw new Error('seed-e2e ne s’exécute que sur la base glaciora_test avec APP_ENV=test');
  }
  await runCatalogueImport({ catalogueDir: path.resolve(env.CATALOGUE_DIR), copyImages: true });
  const variants = await prisma.productVariant.findMany({ where: { isActive: true, product: { status: 'ACTIVE' } }, select: { id: true } });
  for (const v of variants) {
    await prisma.stock.upsert({ where: { variantId: v.id }, create: { variantId: v.id, quantity: 5 }, update: { quantity: 5 } });
  }
  const email = process.env.E2E_ADMIN_EMAIL ?? 'admin.e2e@glaciora.test';
  const password = process.env.E2E_ADMIN_PASSWORD ?? 'e2e-Admin-Passw0rd';
  await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash: await hashPassword(password), role: 'ADMIN', firstName: 'Admin', lastName: 'E2E' },
    update: { role: 'ADMIN', isActive: true, failedLoginCount: 0, lockedUntil: null },
  });
  console.warn(`Base de test prête : ${variants.length} variantes avec stock [TEST].`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
