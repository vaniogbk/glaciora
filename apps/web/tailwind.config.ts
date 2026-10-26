import type { Config } from 'tailwindcss';
import { colors, fonts, radii, shadows } from './src/theme/tokens';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }, screens: { '2xl': '1320px' } },
    extend: {
      colors,
      fontFamily: { sans: [...fonts.sans] },
      borderRadius: radii,
      boxShadow: shadows,
      letterSpacing: { brand: '0.18em' },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'none' } },
        pop: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.18)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: { 'fade-up': 'fade-up 0.5s ease-out both', pop: 'pop 0.4s ease-out' },
    },
  },
  plugins: [],
};

export default config;
