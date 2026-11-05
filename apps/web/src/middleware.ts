import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, matchLocale, type Locale } from '@/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * 1. /api : ajoute le secret partagé (PROXY_SECRET, variable serveur de Vercel) aux appels relayés vers l'API Railway,
 *    qui refuse ainsi tout appel direct contournant le site. Une valeur envoyée par le navigateur est écrasée.
 * 2. Pages : langue du site. Une URL préfixée (/de/…) s'affiche telle quelle. Une URL sans préfixe est servie en français,
 *    sauf si le visiteur a choisi une autre langue (cookie) ou, à défaut, si son navigateur en demande une : redirection
 *    vers la version de cette langue. « /fr/… » redirige vers l'adresse sans préfixe.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith('/api/')) {
    const secret = process.env.PROXY_SECRET;
    if (!secret) return NextResponse.next();
    const headers = new Headers(req.headers);
    headers.set('x-glaciora-proxy', secret);
    return NextResponse.next({ request: { headers } });
  }

  const first = pathname.split('/')[1];
  if (first === DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || '/';
    return withLocaleCookie(NextResponse.redirect(url, 308), DEFAULT_LOCALE);
  }
  if (isLocale(first)) return NextResponse.next();

  const chosen = req.cookies.get(LOCALE_COOKIE)?.value;
  const preferred: Locale = isLocale(chosen) ? chosen : (matchLocale(req.headers.get('accept-language')) ?? DEFAULT_LOCALE);
  if (preferred !== DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferred}${pathname === '/' ? '' : pathname}`;
    const response = NextResponse.redirect(url, 307);
    response.headers.set('Vary', 'Accept-Language, Cookie');
    return isLocale(chosen) ? response : withLocaleCookie(response, preferred);
  }
  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

function withLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: ONE_YEAR, sameSite: 'lax' });
  return response;
}

export const config = {
  // Pages publiques uniquement : ni l'admin (en français), ni les fichiers (images, polices, sitemap.xml, robots.txt…).
  matcher: ['/api/:path*', '/((?!api|_next|_vercel|admin|media|brand|.*\\..*).*)'],
};
