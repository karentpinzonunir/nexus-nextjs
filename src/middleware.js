// src/middleware.js
import { NextResponse } from 'next/server';

const LOCALES = ['es-ES', 'en-US', 'fr-FR', 'it-IT', 'de-DE'];
const DEFAULT_LOCALE = 'es-ES';

function parseAcceptLanguage(header) {
  if (!header) return [];
  return header
    .split(',')
    .map(part => {
      const [lang, q] = part.trim().split(';');
      const weight = q ? Number(q.split('=')[1]) : 1;
      return { lang, weight };
    })
    .sort((a, b) => b.weight - a.weight)
    .map(x => x.lang);
}

function pickLocaleFromHeader(acceptLangs) {
  for (const al of acceptLangs) {
    // 1) match exact locale like en-US
    const exact = LOCALES.find(l => l.toLowerCase() === al.toLowerCase());
    if (exact) return exact;
    // 2) match primary language like 'en' -> 'en-US' (first matching locale)
    const primary = al.split('-')[0];
    const matched = LOCALES.find(l => l.split('-')[0] === primary);
    if (matched) return matched;
  }
  return DEFAULT_LOCALE;
}

export function middleware(request) {
  const { nextUrl, headers, cookies } = request;
  const pathname = nextUrl.pathname;

  // Ignorar rutas internas y assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    return;
  }

  // Si la URL ya contiene un locale, no hagas nada
  if (LOCALES.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    return;
  }

  // 1) cookie NEXT_LOCALE (si la usas)
  const cookie = cookies.get && cookies.get('NEXT_LOCALE');
  const cookieLocale = cookie ? cookie.value : undefined;
  if (cookieLocale && LOCALES.includes(cookieLocale)) {
    const url = nextUrl.clone();
    url.pathname = `/${cookieLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // 2) cabecera Accept-Language
  const accept = headers.get('accept-language') || '';
  const langs = parseAcceptLanguage(accept);
  const locale = pickLocaleFromHeader(langs);

  const url = nextUrl.clone();
  url.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(url);
}

// Aplica el middleware a todas las rutas excepto internas
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico).*)'
  ],
};