import { readFileSync } from 'node:fs';
import path from 'node:path';
import { EUROPEAN_COUNTRIES } from '@glaciora/shared';

const read = (file: string) => readFileSync(path.resolve(__dirname, '..', file), 'utf8');
const config = JSON.parse(read('data/shipping-rates.json')) as { zones: { name: string; countries: string[]; rates: { name: string; priceCents: number }[] }[] };

describe('frais de livraison (envoi depuis la Pologne)', () => {
  it('rattache chaque pays proposé à une zone qui a un tarif standard', () => {
    const zoned = config.zones.flatMap((z) => z.countries);
    for (const { code } of EUROPEAN_COUNTRIES) expect(zoned).toContain(code);
    for (const zone of config.zones) expect(zone.rates.some((r) => r.name === 'Poczta Polska' && r.priceCents > 0)).toBe(true);
  });

  it('n’affiche que les transporteurs réellement utilisés, avec l’express pour toute l’UE', () => {
    expect([...new Set(config.zones.flatMap((z) => z.rates.map((r) => r.name)))].sort()).toEqual(['FedEx Express', 'Poczta Polska']);
    const eu = config.zones.find((z) => z.name === 'Union européenne')!;
    expect(eu.rates.map((r) => [r.name, r.priceCents])).toEqual([
      ['Poczta Polska', 2500],
      ['FedEx Express', 5000],
    ]);
  });

  it('la migration ouvre les 10 pays de l’UE restants et renomme les tarifs en place', () => {
    const sql = read('prisma/migrations/20261125010000_shipping_poland_carriers/migration.sql');
    const opened = [...(sql.match(/"code" IN \(([^)]*)\)/)?.[1] ?? '').matchAll(/'([A-Z]{2})'/g)].map((m) => m[1]);
    expect(opened.sort()).toEqual(['BG', 'CY', 'DK', 'GR', 'HR', 'HU', 'IE', 'LV', 'MT', 'RO']);
    const eu = config.zones.find((z) => z.name === 'Union européenne')!;
    for (const code of opened) expect(eu.countries).toContain(code);
    expect(sql).not.toMatch(/DELETE|priceCents/);
  });
});
