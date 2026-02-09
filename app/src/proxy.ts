import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas que requieren autenticación
  const protectedRoutes = ['/checkout', '/profile', '/admin', '/orders']
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // Mejor Auth usa cookies con prefijo 'better-auth.session_token' (o similar, por defecto 'better-auth.session_token')
  // Verificamos si existe la cookie para una protección optimista en Edge
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__Secure-better-auth.session_token')

  if (isProtectedRoute && !sessionCookie) {
    const url = request.nextUrl.clone()

    url.pathname = '/auth/login'
    url.searchParams.set('callbackUrl', pathname)

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
