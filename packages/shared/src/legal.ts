/**
 * Mentions légales : identité de l'éditeur du site (le vendeur) et de son hébergeur. Le propriétaire de la boutique
 * les saisit lui-même dans l'admin (/admin/mentions-legales) ; tant qu'un champ est vide, la page publique affiche
 * « À compléter ». Rien n'est pré-rempli : ces informations ne sont connues que du propriétaire.
 */
export const LEGAL_FIELDS = [
  'companyName',
  'legalForm',
  'shareCapital',
  'registration',
  'vatNumber',
  'headOffice',
  'publicationDirector',
  'hostName',
  'hostAddress',
] as const;
export type LegalField = (typeof LEGAL_FIELDS)[number];
export type LegalNoticeData = Record<LegalField, string | null> & { updatedAt: string | null };

/**
 * Identité du vendeur vérifiée le 2026-11-23 dans le registre public polonais CEIDG (statut « Aktywny »,
 * début d'activité le 2026-11-23, PKD 47.63.Z vente au détail d'articles de sport). REGON pas encore attribué,
 * pas d'inscription TVA sur la liste blanche du ministère des Finances à cette date : ces champs restent à compléter.
 * Hébergeur : adresse publiée sur vercel.com/legal. Une saisie dans l'admin remplace ces valeurs champ par champ.
 */
export const LEGAL_NOTICE_DEFAULTS: Partial<Record<LegalField, string>> = {
  companyName: 'KATARZYNA OPANOWICZ',
  legalForm: 'Jednoosobowa działalność gospodarcza (CEIDG)',
  shareCapital: '—',
  registration: 'CEIDG · NIP 9580555988',
  headOffice: 'Różana 70\n84-230 Rumia\nPolska',
  publicationDirector: 'Katarzyna Opanowicz',
  hostName: 'Vercel Inc.',
  hostAddress: '440 N Barranca Ave #4133\nCovina, CA 91723\nUSA',
};

/** Fiche vide (API injoignable ou pas encore saisie). */
export const EMPTY_LEGAL_NOTICE: LegalNoticeData = {
  ...(Object.fromEntries(LEGAL_FIELDS.map((k) => [k, null])) as Record<LegalField, null>),
  updatedAt: null,
};

/** Complète chaque champ non saisi avec la valeur vérifiée par défaut. */
export function withLegalDefaults(notice: LegalNoticeData): LegalNoticeData {
  const filled = { ...notice };
  for (const k of LEGAL_FIELDS) filled[k] = notice[k] ?? LEGAL_NOTICE_DEFAULTS[k] ?? null;
  return filled;
}
