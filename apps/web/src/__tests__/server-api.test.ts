/**
 * Rendu serveur : chaque appel à l'API porte le secret du proxy et le repère « rendu serveur », pour ne pas être compté
 * dans la limite par adresse IP (toutes ces requêtes partent des serveurs de Vercel).
 */
describe('appels de l’API depuis le rendu serveur', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
    jest.resetModules();
  });

  it('envoie le secret du proxy et le repère du rendu serveur', async () => {
    process.env.PROXY_SECRET = 'secret-de-test-1234';
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ promotion: null }) });
    global.fetch = fetchMock as unknown as typeof fetch;
    const { getPromotion } = await import('@/lib/server-api');
    await getPromotion();
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['x-glaciora-proxy']).toBe('secret-de-test-1234');
    expect(headers['x-glaciora-ssr']).toBe('secret-de-test-1234');
  });

  it('n’envoie aucun repère sans secret configuré (développement)', async () => {
    delete process.env.PROXY_SECRET;
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ promotion: null }) });
    global.fetch = fetchMock as unknown as typeof fetch;
    const { getPromotion } = await import('@/lib/server-api');
    await getPromotion();
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['x-glaciora-ssr']).toBeUndefined();
  });
});
