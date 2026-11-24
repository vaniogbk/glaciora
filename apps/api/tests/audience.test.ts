import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildProductWhere } from '../src/modules/catalogue/catalogue.repository';
import { productQuerySchema } from '@glaciora/shared';

const data = (file: string) => readFileSync(path.resolve(__dirname, '..', file), 'utf8');
const rows = data('data/catalogue-audience.csv')
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const [reference, slug, audience, evidence] = line.split(';');
    return { reference, slug, audience, evidence };
  });

describe('rayons Hommes / Femmes / Enfants', () => {
  it('classe chaque article du catalogue une seule fois, avec une preuve', () => {
    const products = (JSON.parse(data('data/catalogue-snapshot.json')) as { products: { reference: string; slug: string }[] }).products;
    expect(rows.map((r) => r.reference).sort()).toEqual(products.map((p) => p.reference).sort());
    for (const p of products) expect(rows.find((r) => r.reference === p.reference)?.slug).toBe(p.slug);
    for (const r of rows) {
      expect(['MEN', 'WOMEN', 'KIDS', 'UNISEX']).toContain(r.audience);
      expect(r.evidence?.length).toBeGreaterThan(3);
    }
  });

  it('la migration classe les articles déjà en ligne comme le fichier', () => {
    const sql = data('prisma/migrations/20261125000000_product_audience/migration.sql');
    for (const audience of ['MEN', 'WOMEN', 'KIDS']) {
      const line = sql.split('\n').find((l) => l.includes(`= '${audience}'`)) ?? '';
      const inSql = [...line.matchAll(/'(GLA-\d{3})'/g)].map((m) => m[1]).sort();
      expect(inSql).toEqual(rows.filter((r) => r.audience === audience).map((r) => r.reference).sort());
    }
  });

  it('montre les articles mixtes chez les hommes et chez les femmes, pas chez les enfants', () => {
    const where = (audience: string) => JSON.stringify(buildProductWhere(productQuerySchema.parse({ audience })));
    expect(where('femmes')).toContain('{"audience":{"in":["WOMEN","UNISEX"]}}');
    expect(where('hommes')).toContain('{"audience":{"in":["MEN","UNISEX"]}}');
    expect(where('enfants')).toContain('{"audience":{"in":["KIDS"]}}');
    expect(() => productQuerySchema.parse({ audience: 'autre' })).toThrow();
  });
});
