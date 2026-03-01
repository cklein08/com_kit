import { NextResponse } from 'next/server';
import {
  createStateJWT,
  getAuthorizeUrl,
  isEntraConfigured,
  ORIGINAL_URL_PARAM,
} from '@/lib/auth/entra';

const AUTH_PREFIX = '/api/auth/entra';

export async function GET(request) {
  if (!isEntraConfigured()) {
    return NextResponse.json(
      {
        error:
          'Microsoft Entra ID not configured. Set MICROSOFT_ENTRA_TENANT_ID, MICROSOFT_ENTRA_CLIENT_ID, MICROSOFT_ENTRA_JWKS_URL, AUTH_SECRET.',
      },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}${AUTH_PREFIX}/callback`;

  const { searchParams } = new URL(request.url);
  let originalUrl = searchParams.get(ORIGINAL_URL_PARAM) || searchParams.get('url');
  if (!originalUrl && request.headers.get('Referer')) {
    try {
      const referer = new URL(request.headers.get('Referer'));
      if (referer.origin === baseUrl) {
        originalUrl = referer.searchParams.get(ORIGINAL_URL_PARAM) || referer.pathname + referer.search;
      }
    } catch {
      // ignore
    }
  }

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const stateJWT = await createStateJWT(state, nonce);

  const authorizeUrl = getAuthorizeUrl(redirectUri, state, nonce, originalUrl);

  const res = NextResponse.redirect(authorizeUrl);

  // Store state in signed cookie (SameSite=None for cross-site callback from Microsoft)
  const isLocalhost = request.nextUrl.hostname === 'localhost';
  res.cookies.set('State', stateJWT, {
    path: '/',
    httpOnly: true,
    secure: !isLocalhost,
    sameSite: 'none',
    maxAge: 60 * 10, // 10 minutes
  });

  return res;
}
