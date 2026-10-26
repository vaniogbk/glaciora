export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export const SITE_NAME = 'GLACIORA';
export const DEFAULT_DESCRIPTION =
  'GLACIORA, boutique de ski, de hockey sur glace et de sports de neige : skis, chaussures, patins, crosses, casques et accessoires livrés partout en Europe.';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
