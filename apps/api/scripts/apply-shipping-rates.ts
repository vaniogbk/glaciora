import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { EUROPEAN_COUNTRIES } from '@glaciora/shared';
import { prisma } from '../src/lib/prisma';
import { logActivity } from '../src/lib/activity';

/**
 * npm run shipping:apply -w @glaciora/api
 * Applique data/shipping-rates.json (tarifs relevés sur le marché, avec source) :
 * zones, rattachement des pays, tarifs. Les tarifs absents du fichier (ex. « [DÉMO] ») sont supprimés.
 * L'activation des pays n'est pas modifiée (Admin > Livraison).
 */
const configSchema = z.object({
  checkedAt: z.string(),
  zones: z.array(
    z.object({
      name: z.string().min(2),
      countries: z.array(z.string().length(2)),
      rates: z.array(
        z.object({
          name: z.string().min(2),
          priceCents: z.number().int().min(0),
          freeAboveCents: z.number().int().min(0).nullable(),
          source: z.string().url(),
        }),
      ),
    }),
  ),
});

async function main() {
  const config = configSchema.parse(JSON.parse(await readFile(path.resolve('data', 'shipping-rates.json'), 'utf8')));
  for (const zoneConfig of config.zones) {
    const zone = await prisma.shippingZone.upsert({ where: { name: zoneConfig.name }, create: { name: zoneConfig.name }, update: { isActive: true } });
    for (const code of zoneConfig.countries) {
      const known = EUROPEAN_COUNTRIES.find((c) => c.code === code);
      if (!known) throw new Error(`Pays inconnu : ${code}`);
      await prisma.shippingCountry.upsert({ where: { code }, create: { code, name: known.name, zoneId: zone.id, isEnabled: false }, update: { zoneId: zone.id } });
    }
    const names = zoneConfig.rates.map((r) => r.name);
    const removed = await prisma.shippingRate.deleteMany({ where: { zoneId: zone.id, name: { notIn: names } } });
    for (const rate of zoneConfig.rates) {
      const existing = await prisma.shippingRate.findFirst({ where: { zoneId: zone.id, name: rate.name } });
      const data = { priceCents: rate.priceCents, freeAboveCents: rate.freeAboveCents, isActive: true, minDays: null, maxDays: null };
      if (existing) await prisma.shippingRate.update({ where: { id: existing.id }, data });
      else await prisma.shippingRate.create({ data: { ...data, zoneId: zone.id, name: rate.name } });
    }
    console.warn(`${zoneConfig.name} : ${zoneConfig.rates.map((r) => `${r.name} ${(r.priceCents / 100).toFixed(2)} €`).join(' · ')}${removed.count ? ` (${removed.count} ancien(s) tarif(s) supprimé(s))` : ''}`);
  }
  await logActivity({ action: 'shipping.rates_applied', entityType: 'ShippingRate', metadata: { checkedAt: config.checkedAt } });
  const offered = await prisma.shippingCountry.findMany({ where: { isEnabled: true, zone: { rates: { some: { isActive: true } } } }, select: { code: true } });
  console.warn(`Pays proposés au checkout : ${offered.map((c) => c.code).join(', ')}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
