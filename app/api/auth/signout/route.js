import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export function POST() {
  const cookie = clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

export function GET(request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const cookie = clearSessionCookie();
  const res = NextResponse.redirect(new URL('/', baseUrl));
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
