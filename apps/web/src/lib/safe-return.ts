/**
 * Adresse de retour après connexion : uniquement une page du site. Refuse « //hôte » et « /\hôte », que les navigateurs
 * lisent comme une autre origine (redirection ouverte), ainsi que les caractères de contrôle.
 */
export function safeReturn(value: string | null, origin: string = typeof window === 'undefined' ? 'http://localhost' : window.location.origin): string | null {
  if (!value || !value.startsWith('/') || /[\u0000-\u001f\\]/.test(value)) return null;
  try {
    const url = new URL(value, origin);
    return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : null;
  } catch {
    return null;
  }
}
