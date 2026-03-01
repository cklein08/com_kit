import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';
import { COOKIE_SESSION } from '@/lib/auth/entra';

function clearAllAuthCookies(res) {
  const adobe = clearSessionCookie();
  res.cookies.set(adobe.name, adobe.value, adobe.options);
  res.cookies.set(COOKIE_SESSION, '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });
}

export function POST() {
  const res = NextResponse.json({ ok: true });
  clearAllAuthCookies(res);
  return res;
}

export function GET(request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const res = NextResponse.redirect(new URL('/', baseUrl));
  clearAllAuthCookies(res);
  return res;
}
