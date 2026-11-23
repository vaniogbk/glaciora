/**
 * Packs : un ensemble d'articles vendus ensemble avec une remise. Il n'y a pas de « produit pack » en base :
 * le client met chaque article dans son panier (taille au choix) et la remise s'applique automatiquement,
 * côté serveur, dès que le panier contient un pack complet. Le montant à virer (et le contrôle du justificatif)
 * tient donc compte de la remise.
 *
 * Un pack n'est proposé sur le site que si tous ses articles sont en vente (statut ACTIVE, au moins une taille
 * en stock). Les références sont celles du catalogue (GLA-xxx).
 */

/** Remise par défaut d'un pack complet, en pour cent du prix des articles. */
export const PACK_DISCOUNT_PERCENT = 10;

export interface PackDefinition {
  slug: string;
  /** Nom en français ; traductions par slug dans le site (i18n/catalogue). */
  name: string;
  sport: 'SKI' | 'HOCKEY';
  discountPercent: number;
  /** Références catalogue, une par article du pack (une unité de chaque). */
  references: readonly string[];
}

export const PACKS: readonly PackDefinition[] = [
  {
    // Tenue complète + matériel (comme sur un mannequin) : skis avec fixations, chaussures, casque, masque,
    // veste, pantalon et bâtons.
    slug: 'pack-ski-complet-homme',
    name: 'Pack ski complet homme',
    sport: 'SKI',
    discountPercent: PACK_DISCOUNT_PERCENT,
    references: ['GLA-054', 'GLA-014', 'GLA-019', 'GLA-022', 'GLA-042', 'GLA-046', 'GLA-056'],
  },
  {
    // Matériel seul : skis avec fixations, chaussures, casque, masque.
    slug: 'pack-equipement-ski',
    name: 'Pack équipement ski',
    sport: 'SKI',
    discountPercent: PACK_DISCOUNT_PERCENT,
    references: ['GLA-055', 'GLA-018', 'GLA-019', 'GLA-021'],
  },
  {
    // Joueur senior équipé de la tête aux pieds, crosse et palets compris.
    slug: 'pack-hockey-complet-senior',
    name: 'Pack hockey complet senior',
    sport: 'HOCKEY',
    discountPercent: PACK_DISCOUNT_PERCENT,
    references: ['GLA-067', 'GLA-069', 'GLA-066', 'GLA-059', 'GLA-063', 'GLA-061', 'GLA-060', 'GLA-065', 'GLA-071', 'GLA-037'],
  },
];

export function findPack(slug: string): PackDefinition | undefined {
  return PACKS.find((p) => p.slug === slug);
}

/** Remise d'un pack sur la somme des prix de ses articles (une unité chacun), arrondie au centime. */
export function packDiscountCents(itemsTotalCents: number, discountPercent: number): number {
  return Math.round((itemsTotalCents * discountPercent) / 100);
}

export interface PackCartLine {
  productReference: string;
  unitPriceCents: number;
  quantity: number;
  /** Ligne achetable (produit en vente, prix > 0, stock suffisant) : sinon elle ne compte pas pour un pack. */
  purchasable: boolean;
}

export interface AppliedPack {
  slug: string;
  name: string;
  /** Nombre de packs complets reconnus dans le panier. */
  count: number;
  discountCents: number;
}

/**
 * Packs complets présents dans le panier et remise totale. Chaque unité ne sert qu'à un seul pack ; les packs
 * les plus avantageux pour le client sont reconnus en premier, et pour chaque pack on retient l'unité la moins
 * chère de chaque article (remise prudente, indépendante de l'ordre des lignes).
 */
export function applyPackDiscounts(lines: readonly PackCartLine[], packs: readonly PackDefinition[] = PACKS) {
  // Unités disponibles par référence, de la moins chère à la plus chère.
  const units = new Map<string, number[]>();
  for (const line of lines) {
    if (!line.purchasable || line.quantity < 1) continue;
    const list = units.get(line.productReference) ?? [];
    for (let i = 0; i < line.quantity; i++) list.push(line.unitPriceCents);
    units.set(line.productReference, list);
  }
  for (const list of units.values()) list.sort((a, b) => a - b);

  const setValue = (pack: PackDefinition) =>
    pack.references.every((ref) => (units.get(ref)?.length ?? 0) > 0)
      ? pack.references.reduce((sum, ref) => sum + units.get(ref)![0]!, 0) * pack.discountPercent
      : 0;
  const ordered = [...packs].sort((a, b) => setValue(b) - setValue(a));

  const applied: AppliedPack[] = [];
  let discountCents = 0;
  for (const pack of ordered) {
    if (pack.references.length === 0 || new Set(pack.references).size !== pack.references.length) continue;
    let count = 0;
    let packDiscount = 0;
    while (pack.references.every((ref) => (units.get(ref)?.length ?? 0) > 0)) {
      const itemsTotal = pack.references.reduce((sum, ref) => sum + units.get(ref)!.shift()!, 0);
      packDiscount += packDiscountCents(itemsTotal, pack.discountPercent);
      count++;
    }
    if (count > 0) {
      applied.push({ slug: pack.slug, name: pack.name, count, discountCents: packDiscount });
      discountCents += packDiscount;
    }
  }
  return { applied, discountCents };
}
