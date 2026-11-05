import { safeReturn } from '@/lib/safe-return';

const ORIGIN = 'https://glaciora-chi.vercel.app';

describe('adresse de retour après connexion', () => {
  it('accepte les pages du site', () => {
    expect(safeReturn('/admin', ORIGIN)).toBe('/admin');
    expect(safeReturn('/compte/commandes?page=2#haut', ORIGIN)).toBe('/compte/commandes?page=2#haut');
  });

  it('refuse toute autre origine (redirection ouverte)', () => {
    for (const value of ['//evil.example', '/\\evil.example', '/\\/evil.example', 'https://evil.example', '/\tevil', 'javascript:alert(1)', null, '']) {
      expect(safeReturn(value, ORIGIN)).toBeNull();
    }
  });
});
