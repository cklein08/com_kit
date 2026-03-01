import { NextResponse } from 'next/server';
import { COOKIE_SESSION, getLogoutUrl, validateSessionJWT } from '@/lib/auth/entra';

export async function GET(request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const origin = new URL(baseUrl).origin;

  const sessionJWT = request.cookies.get(COOKIE_SESSION)?.value;
  const session = await validateSessionJWT(sessionJWT, origin);

  const logoutUrl = getLogoutUrl(`${baseUrl}/`);

  const res = NextResponse.redirect(logoutUrl);
  res.cookies.delete(COOKIE_SESSION);
  res.cookies.set(COOKIE_SESSION, '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });

  return res;
}
