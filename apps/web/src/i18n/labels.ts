/**
 * Libellés du catalogue saisis en français dans l'admin, traduits à l'affichage (serveur et navigateur).
 * La valeur d'origine reste utilisée pour les filtres, les variantes et les photos.
 */

/** « Taille unique », « Droite – Flex 77 » : mots connus remplacés, chiffres et mesures conservés. */
export function sizeLabel(label: string, words: Record<string, string>): string {
  if (words[label]) return words[label]!;
  // Tailles enfant enregistrées « 3 ans » : âge suivi de l'abréviation de la langue (« 3 yrs », « 3 J. »).
  const age = label.match(/^(\d+) ans$/);
  if (age) return `${age[1]} ${words.ans ?? 'ans'}`;
  return label.replace(/^(Droite|Gauche)\b/, (word) => words[word] ?? word);
}

const APPAREL_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

/** Tailles dans l'ordre naturel : XS → XXXL d'abord, puis valeurs numériques (« 13" », « 42 », « 5 ans »), puis le reste. */
export function sortSizes(labels: string[]): string[] {
  const rank = (label: string) => {
    const apparel = APPAREL_ORDER.indexOf(label.trim().toUpperCase());
    if (apparel >= 0) return apparel;
    const n = Number.parseFloat(label.replace(',', '.'));
    return Number.isFinite(n) ? 100 + n : Number.POSITIVE_INFINITY;
  };
  return labels.map((label, i) => ({ label, i, r: rank(label) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.label);
}

/** « Noir / Bleu » → « Schwarz / Blau » ; les noms de fabricant (« Matte Black ») restent tels quels. */
export function colorLabel(label: string, colors: Record<string, string>): string {
  return label
    .split('/')
    .map((part) => {
      const trimmed = part.trim();
      return colors[trimmed] ?? trimmed;
    })
    .join(' / ');
}
