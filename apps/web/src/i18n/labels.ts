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
