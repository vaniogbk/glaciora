export const CURRENCY = 'EUR' as const;

/** Formate un montant en centimes (entier) en euros, locale française par défaut. */
export function formatPrice(cents: number, locale = 'fr-FR', currency: string = CURRENCY): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(cents / 100);
}

/** Convertit un prix décimal (ex. « 449,90 » ou 449.9) en centimes entiers. */
export function toCents(value: string | number): number {
  const normalized = typeof value === 'number' ? value : Number(value.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(normalized) || normalized < 0) throw new Error(`Prix invalide : ${value}`);
  return Math.round(normalized * 100);
}
