/**
 * Design tokens GLACIORA — source : « Identité graphique/GLACIORA_LOGO/README_logo.txt ».
 * Toute couleur, police ou rayon utilisé dans l'interface passe par ce fichier (via Tailwind).
 */
export const colors = {
  marine: '#0A1A2F', // Marine glacier — fond principal, texte
  glacier: '#14A3F2', // Bleu glacier — accents sur fond sombre (contraste 6,9:1 sur marine)
  deep: '#0A6FAD', // Bleu profond — liens et boutons sur fond clair (5,4:1 sur blanc)
  frost: '#A9DEFB', // Givre — facettes, détails sur fond sombre
  frostStrong: '#8FD3F8', // Givre soutenu — détails sur fond clair
  snow: '#E8EEF4', // Neige — fonds clairs, cartes
  white: '#FFFFFF',
  // Neutres et états dérivés de la palette (contraste AA vérifié sur blanc)
  ink: '#0A1A2F',
  muted: '#475A70',
  line: '#D3DDE7',
  success: '#0F7B4D',
  warning: '#8A5300',
  danger: '#B42318',
  // Note Black Friday des fiches produit (texte marine dessus, contraste > 12:1).
  note: '#FFE48A',
} as const;

/**
 * Pastilles de coloris des produits (données catalogue, pas la charte) : mot-clé du libellé → teinte affichée.
 * « Noir / Bleu » ou « Race Blue / White » donnent une pastille bicolore ; un libellé inconnu, une pastille neutre.
 */
export const productColorSwatches: Record<string, string> = {
  noir: '#15171A', black: '#15171A', blanc: '#F7F8FA', white: '#F7F8FA', gris: '#8A929B', grey: '#8A929B', gray: '#8A929B',
  argent: '#C3C8CE', silver: '#C3C8CE', bleu: '#1F5FBF', blue: '#1F5FBF', marine: '#14284B', navy: '#14284B', ciel: '#6FB7EA',
  turquoise: '#1BB3B0', vert: '#2E7D4F', green: '#2E7D4F', forest: '#24563B', kaki: '#6B6B3A', rouge: '#C62F2F', red: '#C62F2F',
  rose: '#E0709A', pink: '#E0709A', violet: '#6E3FA8', purple: '#6E3FA8', orange: '#E8741E', jaune: '#E9C229', yellow: '#E9C229',
  or: '#C9A23A', gold: '#C9A23A', marron: '#7A4E2D', brown: '#7A4E2D', beige: '#D9C7A5',
};
/**
 * Coloris de fabricant (libellé complet en minuscules) → pastille, d'après les photos des revendeurs.
 * Prioritaire sur les mots simples ci-dessus (« Halogen Blue » est un bleu glacier, pas un bleu franc).
 */
export const productColorNamed: Record<string, string> = {
  'light grey': '#C9CCCF', 'soft grey': '#E6E7E8', 'neon red': '#FF4A1A', 'tibetan red': '#A0142C', 'true night blue': '#5B6A8E',
  'halogen blue': '#DCE9F5', 'golden gate': '#FF4B1F', 'olive shadow': '#4A4F35', 'wild lime': '#C6E03A', 'electric fuchsia': '#E8148C',
  'beetroot powder': '#E8338A', 'beetroot power': '#F0468C', 'grape royal': '#663A86', 'split pea': '#C8D72A', stonewash: '#A9C6E8',
  'wood ash': '#E3DAC0', 'pure cashmere': '#DDD6C8', shitake: '#C9A97E', clover: '#D63FCB', tobacco: '#76733F', emerald: '#2EC79A',
  'dark sapphire': '#1E3048', 'dress blues': '#2E4A66', 'capri breeze': 'linear-gradient(135deg, #22C1C9 50%, #D63FB0 50%)',
  'wild spot print': 'linear-gradient(135deg, #C9A16B 50%, #3B2A1E 50%)', 'ridding spot print': 'linear-gradient(135deg, #15171A 50%, #D9DBDD 50%)',
  'savage black': 'linear-gradient(135deg, #15171A 50%, #F7F8FA 50%)',
};
export const productColorFallback = '#B9C3CD';
/** Motif multicolore (coloris « Graffiti », « Multicolore »…). */
export const productColorMulti = 'conic-gradient(#C62F2F, #E9C229, #2E7D4F, #1F5FBF, #6E3FA8, #C62F2F)';

export const fonts = {
  // --font-montserrat est toujours défini (police locale chargée par next/font dans app/layout.tsx).
  // Latin étendu en premier : il ne couvre que č, ł, ő… (unicode-range), le reste du texte passe à Montserrat latin.
  // Géorgien de même : unicode-range limité à l'alphabet géorgien, placé avant Montserrat (et ses polices de repli).
  sans: ['var(--font-montserrat-ext)', 'var(--font-georgian)', 'var(--font-montserrat)', 'sans-serif'],
} as const;

export const radii = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
} as const;

export const shadows = {
  card: '0 1px 2px rgba(10, 26, 47, 0.06), 0 8px 24px rgba(10, 26, 47, 0.06)',
  lift: '0 12px 32px rgba(10, 26, 47, 0.14)',
} as const;

/** Zone de protection du logo : au moins la hauteur du « G » (≈ 0,35 × hauteur du logo horizontal). */
export const logo = {
  minWidthPx: 140,
  symbolMinPx: 24,
} as const;
