import { productColorFallback, productColorMulti, productColorSwatches } from '@/theme/tokens';

/** Fond CSS d'une pastille pour un libellé de coloris (« Matte Black », « Noir / Bleu », « Graffiti »…). */
export function swatchBackground(label: string): string {
  const parts = label.split('/').map((part) => part.trim().toLowerCase()).filter(Boolean);
  if (parts.some((part) => /graffiti|multi|camo/.test(part))) return productColorMulti;
  const tones = parts.map((part) => {
    const word = part.split(/[\s-]+/).find((w) => productColorSwatches[w]);
    return word ? productColorSwatches[word]! : productColorFallback;
  });
  if (tones.length >= 2) return `linear-gradient(135deg, ${tones[0]} 50%, ${tones[1]} 50%)`;
  return tones[0] ?? productColorFallback;
}

/** Coloris distincts des variantes, dans l'ordre du catalogue. */
export function variantColors(variants: { color: string | null }[]): string[] {
  return [...new Set(variants.map((v) => v.color?.trim()).filter((c): c is string => Boolean(c)))];
}
