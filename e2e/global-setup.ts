import { execSync } from 'node:child_process';
import path from 'node:path';
import { E2E_ENV } from '../playwright.config';

/** Base de test remise à zéro : migrations, données de référence, catalogue importé, stock [TEST], admin de test. */
export default function globalSetup() {
  if (!/glaciora_test/.test(E2E_ENV.DATABASE_URL)) throw new Error('E2E : base glaciora_test obligatoire');
  const cwd = path.resolve(__dirname, '../apps/api');
  const env = { ...process.env, ...E2E_ENV };
  const run = (cmd: string) => execSync(cmd, { cwd, env, stdio: 'inherit' });
  run('npx prisma migrate reset --force --skip-seed --skip-generate');
  run('npx tsx prisma/seed.ts');
  run('npx tsx scripts/seed-e2e.ts');
}
