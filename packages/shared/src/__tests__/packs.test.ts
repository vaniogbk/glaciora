import { applyPackDiscounts, packDiscountCents, PACKS, type PackDefinition } from '../packs';

const A: PackDefinition = { slug: 'a', name: 'Pack A', sport: 'SKI', discountPercent: 10, references: ['R1', 'R2', 'R3'] };
const B: PackDefinition = { slug: 'b', name: 'Pack B', sport: 'SKI', discountPercent: 10, references: ['R3', 'R4'] };
const line = (productReference: string, unitPriceCents: number, quantity = 1, purchasable = true) => ({ productReference, unitPriceCents, quantity, purchasable });

describe('packs', () => {
  it('arrondit la remise au centime', () => {
    expect(packDiscountCents(130_030, 10)).toBe(13_003);
    expect(packDiscountCents(86_722, 10)).toBe(8_672);
  });

  it('applique la remise quand le panier contient un pack complet', () => {
    const r = applyPackDiscounts([line('R1', 10_000), line('R2', 20_000), line('R3', 30_000), line('X', 5_000)], [A]);
    expect(r.discountCents).toBe(6_000);
    expect(r.applied).toEqual([{ slug: 'a', name: 'Pack A', count: 1, discountCents: 6_000 }]);
  });

  it('ne remise rien si un article manque ou n’est pas achetable', () => {
    expect(applyPackDiscounts([line('R1', 10_000), line('R2', 20_000)], [A]).discountCents).toBe(0);
    expect(applyPackDiscounts([line('R1', 10_000), line('R2', 20_000), line('R3', 30_000, 1, false)], [A]).discountCents).toBe(0);
  });

  it('compte autant de packs que de jeux complets, pas plus', () => {
    const r = applyPackDiscounts([line('R1', 10_000, 2), line('R2', 20_000, 2), line('R3', 30_000, 3)], [A]);
    expect(r.applied[0]!.count).toBe(2);
    expect(r.discountCents).toBe(12_000);
  });

  it('retient l’unité la moins chère quand un article est en plusieurs tailles à des prix différents', () => {
    const r = applyPackDiscounts([line('R1', 10_000), line('R1', 12_000), line('R2', 20_000), line('R3', 30_000)], [A]);
    expect(r.discountCents).toBe(6_000);
  });

  it('n’utilise chaque unité que pour un seul pack, le plus avantageux d’abord', () => {
    // R3 sert aux deux packs : A (60 €) vaut plus que B (40 €).
    const r = applyPackDiscounts([line('R1', 10_000), line('R2', 20_000), line('R3', 30_000), line('R4', 10_000)], [B, A]);
    expect(r.applied.map((p) => p.slug)).toEqual(['a']);
    expect(r.discountCents).toBe(6_000);
  });

  it('définit des packs cohérents (slugs uniques, références distinctes, remise raisonnable)', () => {
    expect(new Set(PACKS.map((p) => p.slug)).size).toBe(PACKS.length);
    for (const p of PACKS) {
      expect(new Set(p.references).size).toBe(p.references.length);
      expect(p.references.length).toBeGreaterThanOrEqual(3);
      expect(p.discountPercent).toBeGreaterThan(0);
      expect(p.discountPercent).toBeLessThanOrEqual(30);
    }
  });
});
