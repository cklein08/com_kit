import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth/session';

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie');
  const session = getSessionFromCookie(cookieHeader);

  if (!session) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: session.user,
  });
}
