import { execSync } from 'node:child_process';

/** Remet la base de test à zéro et applique les migrations avant la suite Jest. */
export default function globalSetup() {
  const url = process.env.DATABASE_URL_TEST ?? 'postgresql://glaciora:glaciora_dev@localhost:5466/glaciora_test';
  if (!/glaciora_test/.test(url)) throw new Error('Les tests ne tournent que sur une base glaciora_test');
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
