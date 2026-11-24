import { readFileSync } from 'node:fs';
import path from 'node:path';
import { isServerRender } from '../src/middlewares/security';

describe('limites anti-abus prêtes pour un fort trafic', () => {
  it('ne reconnaît le rendu serveur du site qu’avec le secret partagé', () => {
    expect(isServerRender('secret-partage-123', 'secret-partage-123')).toBe(true);
    expect(isServerRender('mauvais-secret-123', 'secret-partage-123')).toBe(false);
    expect(isServerRender(undefined, 'secret-partage-123')).toBe(false);
    expect(isServerRender('', 'secret-partage-123')).toBe(false);
    // Sans secret configuré (développement), personne n'est exempté.
    expect(isServerRender('nimporte-quoi', undefined)).toBe(false);
  });

  it('garde des limites strictes sur les écritures sensibles et une limite générale large', () => {
    const source = readFileSync(path.resolve(__dirname, '../src/middlewares/security.ts'), 'utf8');
    const limitOf = (name: string) => Number(source.match(new RegExp(`export const ${name} = limiter\\([^,]+, (\\d+),`))?.[1]);
    expect(limitOf('globalLimiter')).toBeGreaterThanOrEqual(3000);
    expect(source).toMatch(/export const globalLimiter = limiter\([^;]*exemptServerRender: true/);
    expect(limitOf('authLimiter')).toBeLessThanOrEqual(20);
    expect(limitOf('passwordResetLimiter')).toBeLessThanOrEqual(5);
    expect(limitOf('trackingLimiter')).toBeLessThanOrEqual(60);
    expect(limitOf('uploadLimiter')).toBeLessThanOrEqual(20);
    // Seule la limite générale exempte le rendu serveur.
    expect(source.match(/exemptServerRender: true/g)).toHaveLength(1);
  });
});
