import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const hasAuth = request.cookies.getAll().some(c => c.name.includes('sb-') && c.name.includes('-auth-token'));

  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/teacher') || pathname.startsWith('/student')) && !hasAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
