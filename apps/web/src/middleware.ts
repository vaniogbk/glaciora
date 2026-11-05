import { NextResponse, type NextRequest } from 'next/server';

/**
 * Ajoute le secret partagé (PROXY_SECRET, variable serveur de Vercel) aux appels /api relayés vers l'API Railway :
 * l'API refuse ainsi tout appel direct qui contournerait le site. Une valeur envoyée par le navigateur est écrasée.
 */
export function middleware(req: NextRequest) {
  const secret = process.env.PROXY_SECRET;
  if (!secret) return NextResponse.next();
  const headers = new Headers(req.headers);
  headers.set('x-glaciora-proxy', secret);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: '/api/:path*' };
