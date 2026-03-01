import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth/session';
import { validateSessionJWT, COOKIE_SESSION, isEntraConfigured } from '@/lib/auth/entra';

export async function GET(request) {
  const origin = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).origin
    : new URL(request.url).origin;

  // Check Microsoft Entra session (from Next.js or Cloudflare Worker)
  const canValidateEntraSession =
    isEntraConfigured() ||
    (process.env.CLOUDFLARE_AUTH === 'true' &&
      process.env.AUTH_SECRET &&
      process.env.MICROSOFT_ENTRA_CLIENT_ID &&
      process.env.NEXT_PUBLIC_APP_URL);

  if (canValidateEntraSession) {
    const sessionJWT = request.cookies.get(COOKIE_SESSION)?.value;
    const entraSession = await validateSessionJWT(sessionJWT, origin);
    if (entraSession) {
      const logoutUrl = process.env.CLOUDFLARE_AUTH === 'true' ? '/auth/logout' : '/api/auth/entra/logout';
      return NextResponse.json({
        user: {
          name: entraSession.name,
          email: entraSession.email,
          sub: entraSession.sub,
        },
        authProvider: 'entra',
        logoutUrl,
      });
    }
  }

  // Fall back to Adobe IMS session
  const cookieHeader = request.headers.get('cookie');
  const session = getSessionFromCookie(cookieHeader);

  if (!session) {
    const signInUrl =
      process.env.CLOUDFLARE_AUTH === 'true'
        ? '/auth/login'
        : isEntraConfigured()
          ? '/api/auth/entra/login'
          : '/api/auth/adobe';
    return NextResponse.json({
      user: null,
      signInUrl,
    });
  }

  return NextResponse.json({
    user: session.user,
    authProvider: 'adobe',
    logoutUrl: '/api/auth/signout',
  });
}
