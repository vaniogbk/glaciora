import { defineConfig, devices } from '@playwright/test';

/** Mesures de vitesse en conditions mobiles lentes (voir perf/mobile-lent.spec.ts). Séparées des tests e2e et de la CI. */
export default defineConfig({
  testDir: './perf',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { ...devices['Pixel 5'] },
});
