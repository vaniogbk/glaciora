export interface ShippingRateConfig {
  id: string;
  name: string;
  priceCents: number;
  freeAboveCents?: number | null;
  minDays?: number | null;
  maxDays?: number | null;
  isActive: boolean;
}

export interface ShippingZoneConfig {
  id: string;
  name: string;
  isActive: boolean;
  countries: string[];
  rates: ShippingRateConfig[];
}

export interface ShippingQuote {
  rateId: string;
  name: string;
  priceCents: number;
  isFree: boolean;
  minDays?: number | null;
  maxDays?: number | null;
}

/** Liste les tarifs applicables à un pays et à un sous-total, du moins cher au plus cher. */
export function quoteShipping(zones: ShippingZoneConfig[], countryCode: string, subtotalCents: number): ShippingQuote[] {
  const code = countryCode.toUpperCase();
  const zone = zones.find((z) => z.isActive && z.countries.includes(code));
  if (!zone) return [];
  return zone.rates
    .filter((r) => r.isActive)
    .map((r) => {
      const isFree = r.freeAboveCents != null && subtotalCents >= r.freeAboveCents;
      return { rateId: r.id, name: r.name, priceCents: isFree ? 0 : r.priceCents, isFree, minDays: r.minDays, maxDays: r.maxDays };
    })
    .sort((a, b) => a.priceCents - b.priceCents);
}

export function selectShippingQuote(
  zones: ShippingZoneConfig[],
  countryCode: string,
  subtotalCents: number,
  rateId?: string,
): ShippingQuote | null {
  const quotes = quoteShipping(zones, countryCode, subtotalCents);
  if (rateId) return quotes.find((q) => q.rateId === rateId) ?? null;
  return quotes[0] ?? null;
}
