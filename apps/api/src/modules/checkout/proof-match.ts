/**
 * Recherche de la référence de virement et du montant exact dans le texte lu sur un justificatif (texte d'un PDF, ou
 * lecture OCR d'une photo / capture d'écran). Tolère ce que font les banques (tirets supprimés, minuscules, montant
 * « 1 360,90 », « 1.360,90 », « 1,360.90 », « EUR 454.90 ») et les confusions de lecture courantes (O/0, I/l/1).
 */

/** Lettres absentes de l'alphabet des références (sans caractères ambigus), lues à la place de chiffres par l'OCR. */
const REFERENCE_CONFUSIONS: Record<string, string> = { O: '0', I: '1', L: '1', '|': '1' };

/** Texte réduit aux lettres majuscules et chiffres, confusions O/0 et I/L/1 neutralisées (des deux côtés de la comparaison). */
export function compactForReference(text: string): string {
  return text
    .toUpperCase()
    .replace(/[OIL|]/g, (c) => REFERENCE_CONFUSIONS[c]!)
    .replace(/[^0-9A-Z]/g, '');
}

/** Distance d'édition bornée : vrai si a et b diffèrent d'au plus `max` substitution, ajout ou suppression. */
function withinEditDistance(a: string, b: string, max: number): boolean {
  if (Math.abs(a.length - b.length) > max) return false;
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const value = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      current.push(value);
      rowMin = Math.min(rowMin, value);
    }
    if (rowMin > max) return false;
    previous = current;
  }
  return previous[b.length]! <= max;
}

/**
 * La référence figure-t-elle dans le texte ? Exacte après normalisation, ou à un caractère près (un seul caractère mal lu,
 * ajouté ou perdu par l'OCR). Une autre référence diffère sur plusieurs caractères tirés au hasard : elle n'est pas acceptée.
 */
export function containsReference(text: string, reference: string): boolean {
  const haystack = compactForReference(text);
  const needle = compactForReference(reference);
  if (!needle) return false;
  if (haystack.includes(needle)) return true;
  for (let start = 0; start + needle.length - 1 <= haystack.length; start++) {
    for (const length of [needle.length, needle.length - 1, needle.length + 1]) {
      if (start + length > haystack.length) continue;
      if (withinEditDistance(haystack.slice(start, start + length), needle, 1)) return true;
    }
  }
  return false;
}

const GROUPED = String.raw`\d{1,3}(?:[ .,'’]\d{3})+`;

/** Valeurs d'une partie entière « 12 454 » : 12454, mais aussi 454 (un nombre voisin collé par un espace). */
function integerCandidates(raw: string): number[] {
  const groups = raw.split(/[ .,'’]/);
  const values: number[] = [];
  for (let k = 0; k < groups.length; k++) values.push(Number(groups.slice(k).join('')));
  return values;
}

/** Montants (en centimes) lisibles dans le texte. */
export function amountsInText(text: string): Set<number> {
  const normalized = text
    .replace(/[\u00A0\u202F\u2009\u2007]/g, ' ')
    // Confusions OCR à l'intérieur des nombres : O → 0, l / I / | → 1.
    .replace(/(?<=[\d.,])[oO]|[oO](?=[\d])/g, '0')
    .replace(/(?<=[\d.,])[lI|]|[lI|](?=[\d.,]\d)/g, '1');
  const found = new Set<number>();

  // Avec décimales : 454,90 · 1 360,90 · 1.360,90 · 1,360.90 · 454.90 · « 1.360,- » (sans centimes, usage allemand).
  const decimal = new RegExp(String.raw`(?<![\d.,])(${GROUPED}|\d+)\s?[.,]\s?(\d{2}|-{1,2}|—)(?![\d])`, 'g');
  for (const match of normalized.matchAll(decimal)) {
    const cents = /^\d{2}$/.test(match[2]!) ? Number(match[2]) : 0;
    for (const units of integerCandidates(match[1]!)) found.add(units * 100 + cents);
  }

  // Sans décimales mais avec la devise : « 1360 € », « EUR 1 360 ».
  const whole = new RegExp(String.raw`(?:€|EUR)\s?(${GROUPED}|\d+)(?![\d]|[.,]\d)|(?<![\d.,])(${GROUPED}|\d+)\s?(?:€|EUR)`, 'gi');
  for (const match of normalized.matchAll(whole)) {
    for (const units of integerCandidates((match[1] ?? match[2])!)) found.add(units * 100);
  }
  return found;
}

export function containsAmount(text: string, amountCents: number): boolean {
  return amountsInText(text).has(amountCents);
}

/** Un document dont on ne lit presque aucun caractère (photo floue, PDF scanné vide) est illisible. */
export function isReadable(text: string): boolean {
  return (text.match(/[0-9A-Za-zÀ-ÿ]/g)?.length ?? 0) >= 20;
}
