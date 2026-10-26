import type { Prisma } from '@prisma/client';
import type { ShippingZoneConfig } from '@glaciora/shared';
import { prisma } from '../../lib/prisma';

/** Configuration de livraison active, au format attendu par le calcul partagé. */
export async function loadShippingZones(tx: Prisma.TransactionClient = prisma): Promise<ShippingZoneConfig[]> {
  const zones = await tx.shippingZone.findMany({
    include: { countries: { where: { isEnabled: true }, select: { code: true } }, rates: true },
  });
  return zones.map((z) => ({
    id: z.id,
    name: z.name,
    isActive: z.isActive,
    countries: z.countries.map((c) => c.code),
    rates: z.rates.map((r) => ({
      id: r.id,
      name: r.name,
      priceCents: r.priceCents,
      freeAboveCents: r.freeAboveCents,
      minDays: r.minDays,
      maxDays: r.maxDays,
      isActive: r.isActive,
    })),
  }));
}

/** Pays proposés au checkout : activés, rattachés à une zone active ayant au moins un tarif actif. */
export async function listShippableCountries() {
  const countries = await prisma.shippingCountry.findMany({
    where: { isEnabled: true, zone: { isActive: true, rates: { some: { isActive: true } } } },
    orderBy: { name: 'asc' },
    select: { code: true, name: true },
  });
  return countries;
}
