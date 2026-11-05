import { defineConfig, devices } from '@playwright/test';
import e2e from './playwright.config';

/**
 * Mesures de vitesse en conditions mobiles lentes (voir perf/mobile-lent.spec.ts). Séparées des tests e2e et de la CI.
 * PERF_LOCAL=1 : mesure le build local (« npm run build » d'abord) avec l'API et la base de test des e2e,
 * sans dépendre de la connexion Internet — utile pour comparer avant / après une modification.
 */
const local = Boolean(process.env.PERF_LOCAL);
if (local) process.env.PERF_BASE_URL ??= 'http://localhost:3000';

export default defineConfig({
  testDir: './perf',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { ...devices['Pixel 5'] },
  webServer: local ? e2e.webServer : undefined,
});
