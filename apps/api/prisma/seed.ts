import { DEFAULT_ENABLED_COUNTRIES, EUROPEAN_COUNTRIES } from '@glaciora/shared';
import { prisma } from '../src/lib/prisma';
import { ensureCategories } from '../src/modules/catalogue-import/import.service';
import { hashPassword } from '../src/modules/auth/password';

/**
 * Données de référence (idempotent) : catégories, pays et zones de livraison, compte admin initial.
 * Aucun produit, prix, stock ni tarif n'est inventé ici :
 *  - les produits viennent de « npm run import:catalogue » ;
 *  - les tarifs de livraison se saisissent dans Admin > Livraison
 *    (SEED_DEMO_SHIPPING=true ajoute des tarifs [DÉMO] pour le développement et les tests uniquement).
 */
const ZONES: Record<string, string[]> = {
  France: ['FR', 'MC'],
  'Union européenne': ['DE', 'AT', 'BE', 'BG', 'CY', 'HR', 'DK', 'ES', 'EE', 'FI', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'CZ', 'RO', 'SK', 'SI', 'SE'],
  'Europe hors UE': ['CH', 'NO', 'IS', 'LI', 'GB'],
};

async function main() {
  await ensureCategories();

  for (const [name, codes] of Object.entries(ZONES)) {
    const zone = await prisma.shippingZone.upsert({ where: { name }, create: { name }, update: {} });
    for (const code of codes) {
      const country = EUROPEAN_COUNTRIES.find((c) => c.code === code);
      if (!country) continue;
      await prisma.shippingCountry.upsert({
        where: { code },
        create: { code, name: country.name, zoneId: zone.id, isEnabled: (DEFAULT_ENABLED_COUNTRIES as readonly string[]).includes(code) },
        update: {},
      });
    }
  }

  if (process.env.SEED_DEMO_SHIPPING === 'true') {
    const demoRates: Record<string, { priceCents: number; freeAboveCents: number | null; minDays: number; maxDays: number }> = {
      France: { priceCents: 990, freeAboveCents: 15000, minDays: 2, maxDays: 4 },
      'Union européenne': { priceCents: 1990, freeAboveCents: null, minDays: 4, maxDays: 8 },
      'Europe hors UE': { priceCents: 2990, freeAboveCents: null, minDays: 5, maxDays: 10 },
    };
    for (const [zoneName, rate] of Object.entries(demoRates)) {
      const zone = await prisma.shippingZone.findUniqueOrThrow({ where: { name: zoneName } });
      const name = '[DÉMO] Livraison standard';
      const existing = await prisma.shippingRate.findFirst({ where: { zoneId: zone.id, name } });
      if (!existing) await prisma.shippingRate.create({ data: { zoneId: zone.id, name, ...rate } });
    }
    console.warn('Tarifs de livraison [DÉMO] ajoutés (développement / tests uniquement).');
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) throw new Error('ADMIN_PASSWORD : 12 caractères minimum');
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
      await prisma.user.create({
        data: { email: adminEmail, passwordHash: await hashPassword(adminPassword), role: 'ADMIN', firstName: 'Admin', lastName: 'GLACIORA' },
      });
      console.warn(`Compte admin créé pour ${adminEmail}.`);
    } else if (existing.role !== 'ADMIN') {
      console.warn(`${adminEmail} existe déjà avec le rôle ${existing.role} : non modifié.`);
    }
  }
  console.warn('Seed terminé.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
