// src/middleware.js
import { auth0 } from './lib/auth0' // Importamos el cliente de Auth0
import { NextResponse } from 'next/server'

const LOCALES = ['es-ES', 'en-US', 'fr-FR', 'it-IT', 'de-DE']
const DEFAULT_LOCALE = 'es-ES'

// === AUTH0: Delegamos primero las rutas de autenticación ===
export async function middleware(request) {
  const { nextUrl } = request
  const pathname = nextUrl.pathname

  // Si es una ruta de Auth0, delegamos (sin redirección automática de idioma)
  if (pathname.startsWith('/auth/')) {
    return await auth0.middleware(request)
  }

  // === Ignorar rutas internas y assets ===
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico'
  ) {
    return
  }

  // === Si la URL ya contiene un locale, dejar pasar ===
  if (LOCALES.some(l => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) {
    return
  }

  // === Detectar idioma preferido (cookie o Accept-Language) ===
  const cookie = request.cookies.get('NEXT_LOCALE')
  const cookieLocale = cookie ? cookie.value : undefined
  if (cookieLocale && LOCALES.includes(cookieLocale)) {
    const url = nextUrl.clone()
    url.pathname = `/${cookieLocale}${pathname}`
    return NextResponse.redirect(url)
  }

  const accept = request.headers.get('accept-language') || ''
  const langs = parseAcceptLanguage(accept)
  const locale = pickLocaleFromHeader(langs)

  const url = nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  return NextResponse.redirect(url)
}

// === Funciones de detección de idioma (ya las tenías) ===
function parseAcceptLanguage(header) {
  if (!header) return []
  return header
    .split(',')
    .map(part => {
      const [lang, q] = part.trim().split(';')
      const weight = q ? Number(q.split('=')[1]) : 1
      return { lang, weight }
    })
    .sort((a, b) => b.weight - a.weight)
    .map(x => x.lang)
}

function pickLocaleFromHeader(acceptLangs) {
  for (const al of acceptLangs) {
    const exact = LOCALES.find(l => l.toLowerCase() === al.toLowerCase())
    if (exact) return exact

    const primary = al.split('-')[0]
    const matched = LOCALES.find(l => l.split('-')[0] === primary)
    if (matched) return matched
  }
  return DEFAULT_LOCALE
}

// === Configuración del matcher ===
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico).*)',
  ],
}