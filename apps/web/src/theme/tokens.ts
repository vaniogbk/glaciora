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
} as const;

export const fonts = {
  sans: ['var(--font-montserrat)', 'Montserrat', 'system-ui', 'sans-serif'],
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
