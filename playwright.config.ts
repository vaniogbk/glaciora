import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de bout en bout sur une base dédiée (glaciora_test) : catalogue réel importé,
 * stock et tarifs de livraison de TEST, IBAN d’exemple. Lancer d’abord « npm run build ». La base est préparée par « npm run e2e:prepare » (apps/api) avant le démarrage de l’API.
 */
const TEST_DB = process.env.E2E_DATABASE_URL ?? 'postgresql://glaciora:glaciora_dev@localhost:5466/glaciora_test';

export const E2E_ENV = {
  NODE_ENV: 'test',
  APP_ENV: 'test',
  PORT: '4000',
  DATABASE_URL: TEST_DB,
  WEB_ORIGIN: 'http://localhost:3000',
  PUBLIC_SITE_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'e2e-access-secret-0123456789-abcdefghijklmnop',
  JWT_REFRESH_SECRET: 'e2e-refresh-secret-0123456789-abcdefghijklmno',
  BANK_ACCOUNT_HOLDER: 'GLACIORA [TEST]',
  BANK_IBAN: 'FR7630006000011234567890189',
  BANK_BIC: 'AGRIFRPP',
  EMAIL_PROVIDER: 'console',
  STORAGE_DRIVER: 'local',
  STORAGE_LOCAL_DIR: './storage/e2e-private',
  CATALOGUE_DIR: '../../GLACIORA_CATALOGUE',
  SEED_DEMO_SHIPPING: 'true',
  E2E_ADMIN_EMAIL: 'admin.e2e@glaciora.test',
  E2E_ADMIN_PASSWORD: 'e2e-Admin-Passw0rd',
};

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Base de test préparée AVANT le démarrage de l'API (migrations, seed, catalogue, stock [TEST]).
      command: 'npm run e2e:prepare && npx tsx src/server.ts',
      cwd: './apps/api',
      url: 'http://localhost:4000/api/health',
      env: E2E_ENV,
      reuseExistingServer: false,
      timeout: 300_000,
    },
    {
      // Cache de données Next vidé : la base de test est recréée à chaque exécution (nouveaux identifiants).
      command: `node -e "require('fs').rmSync('.next/cache/fetch-cache',{recursive:true,force:true})" && npx next start -p 3000`,
      cwd: './apps/web',
      url: 'http://localhost:3000',
      env: { API_URL: 'http://localhost:4000', NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
