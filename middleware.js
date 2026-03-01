import { NextResponse } from 'next/server';
import { validateSessionJWT, COOKIE_SESSION, isEntraConfigured } from '@/lib/auth/entra';

const LOGIN_PAGE = process.env.LOGIN_PAGE || '/';
const AUTH_PREFIX = '/api/auth';

/** Paths that never require authentication (like awesomeportal) */
const PUBLIC_PATHS = [
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/filter-definition.json',
  '/public',
  '/icons',
  '/fonts',
];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request) {
  // Skip auth when disabled (like awesomeportal DISABLE_AUTHENTICATION)
  if (process.env.DISABLE_AUTHENTICATION === 'true') {
    return NextResponse.next();
  }

  // Require auth only when explicitly enabled (opt-in for storefront)
  if (process.env.REQUIRE_AUTHENTICATION !== 'true') {
    return NextResponse.next();
  }

  // Route protection requires Microsoft Entra (Edge runtime can't verify Adobe HMAC cookies)
  if (!isEntraConfigured()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const sessionJWT = request.cookies.get(COOKIE_SESSION)?.value;
  const session = await validateSessionJWT(sessionJWT, origin);
  if (session) {
    return NextResponse.next();
  }

  // Redirect to login with original URL
  const loginUrl = new URL(`${AUTH_PREFIX}/entra/login`, origin);
  if (pathname !== '/' && pathname !== LOGIN_PAGE) {
    loginUrl.searchParams.set('url', pathname + request.nextUrl.search);
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
