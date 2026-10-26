/** Pays européens connus de la boutique. L'activation et les tarifs se gèrent dans l'admin. */
export const EUROPEAN_COUNTRIES: ReadonlyArray<{ code: string; name: string }> = [
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'AT', name: 'Autriche' },
  { code: 'BE', name: 'Belgique' },
  { code: 'BG', name: 'Bulgarie' },
  { code: 'CY', name: 'Chypre' },
  { code: 'HR', name: 'Croatie' },
  { code: 'DK', name: 'Danemark' },
  { code: 'ES', name: 'Espagne' },
  { code: 'EE', name: 'Estonie' },
  { code: 'FI', name: 'Finlande' },
  { code: 'GR', name: 'Grèce' },
  { code: 'HU', name: 'Hongrie' },
  { code: 'IE', name: 'Irlande' },
  { code: 'IT', name: 'Italie' },
  { code: 'LV', name: 'Lettonie' },
  { code: 'LT', name: 'Lituanie' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malte' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'PL', name: 'Pologne' },
  { code: 'PT', name: 'Portugal' },
  { code: 'CZ', name: 'Tchéquie' },
  { code: 'RO', name: 'Roumanie' },
  { code: 'SK', name: 'Slovaquie' },
  { code: 'SI', name: 'Slovénie' },
  { code: 'SE', name: 'Suède' },
  { code: 'CH', name: 'Suisse' },
  { code: 'NO', name: 'Norvège' },
  { code: 'IS', name: 'Islande' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'MC', name: 'Monaco' },
];

/** Pays mis en avant dans l'identité graphique : activés par défaut au premier seed. */
export const DEFAULT_ENABLED_COUNTRIES = ['FR', 'DE', 'AT', 'CH', 'CZ', 'SK', 'SE', 'FI', 'NO'] as const;

export function countryName(code: string): string {
  return EUROPEAN_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}
