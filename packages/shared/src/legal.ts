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

/** Fiche vide (API injoignable ou pas encore saisie). */
export const EMPTY_LEGAL_NOTICE: LegalNoticeData = {
  ...(Object.fromEntries(LEGAL_FIELDS.map((k) => [k, null])) as Record<LegalField, null>),
  updatedAt: null,
};
