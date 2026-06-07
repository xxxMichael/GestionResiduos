import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('admin_session');

  // Si intentan entrar a /admin y no tienen la cookie de sesión, redirigir a /login
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Si están en /login pero ya tienen sesión activa, redirigir automáticamente al dashboard
  if (request.nextUrl.pathname.startsWith('/login')) {
    if (session) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

// Limitar la ejecución del middleware solo a estas rutas
export const config = {
  matcher: ['/admin/:path*', '/login'],
};
