/**
 * Conditions générales de vente et politique de confidentialité, rédigées d'après le fonctionnement réel de la boutique
 * (virement SEPA avec preuve vérifiée, carte via Mollie, suivi en 3 étapes, cookies et durées réels).
 * Variables : {brand}, {site}, {seller}, {legalForm}, {registration}, {address}, {email}, {phone} — l'identité du vendeur
 * vient des mentions légales (valeurs vérifiées au registre CEIDG, modifiables dans l'admin).
 */
export type LegalSection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
  after?: string[];
};

export type LegalDoc = {
  version: string;
  intro: string[];
  sections: LegalSection[];
  annex?: { title: string; note: string; lines: string[] };
};

export type LegalDocs = { terms: LegalDoc; privacy: LegalDoc };
