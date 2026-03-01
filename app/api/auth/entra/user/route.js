import { NextResponse } from 'next/server';
import { COOKIE_SESSION, validateSessionJWT } from '@/lib/auth/entra';

export async function GET(request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const origin = new URL(baseUrl).origin;

  const sessionJWT = request.cookies.get(COOKIE_SESSION)?.value;
  const session = await validateSessionJWT(sessionJWT, origin);

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    name: session.name,
    email: session.email,
    country: session.country,
    usertype: session.usertype,
    sessionExpiresInSec: session.exp ? Math.floor(session.exp * 1000 - Date.now()) / 1000 : null,
  });
}
