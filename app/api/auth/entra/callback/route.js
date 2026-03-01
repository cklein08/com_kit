import { NextResponse } from 'next/server';
import {
  COOKIE_SESSION,
  createSessionJWT,
  validateIdToken,
  validateStateJWT,
  isEntraConfigured,
} from '@/lib/auth/entra';

const AUTH_PREFIX = '/api/auth/entra';
const LOGIN_PAGE = process.env.LOGIN_PAGE || '/';

export async function POST(request) {
  if (!isEntraConfigured()) {
    return NextResponse.json({ error: 'Microsoft Entra ID not configured.' }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const origin = new URL(baseUrl).origin;

  const stateCookie = request.cookies.get('State')?.value;
  const state = await validateStateJWT(stateCookie);
  if (!state) {
    return NextResponse.json({ error: 'Invalid or missing state' }, { status: 401 });
  }

  const formData = await request.formData();
  const error = formData.get('error');
  if (error) {
    const errorUrl = new URL('/', baseUrl);
    errorUrl.searchParams.set('auth_error', formData.get('error_description') || error);
    const res = NextResponse.redirect(errorUrl);
    res.cookies.delete('State');
    return res;
  }

  const idToken = formData.get('id_token');
  if (!idToken) {
    return NextResponse.json({ error: 'No id_token in callback' }, { status: 401 });
  }

  if (formData.get('state') !== state.state) {
    return NextResponse.json({ error: 'Invalid state parameter' }, { status: 401 });
  }

  const idTokenPayload = await validateIdToken(idToken, state.nonce);
  if (!idTokenPayload) {
    return NextResponse.json({ error: 'Invalid id_token' }, { status: 401 });
  }

  const sessionJWT = await createSessionJWT(idTokenPayload, origin);

  let redirectUrl = `${baseUrl}/`;
  const originalUrl = state.state.split('|')[1];
  if (
    originalUrl?.startsWith('/') &&
    originalUrl !== LOGIN_PAGE &&
    originalUrl !== `${AUTH_PREFIX}/login`
  ) {
    redirectUrl = `${baseUrl}${originalUrl}`;
  }

  const res = NextResponse.redirect(redirectUrl);
  const isLocalhost = new URL(baseUrl).hostname === 'localhost';

  res.cookies.set(COOKIE_SESSION, sessionJWT, {
    path: '/',
    httpOnly: true,
    secure: !isLocalhost,
    sameSite: 'lax',
    maxAge: 60 * 60 * 6, // 6 hours default
  });
  res.cookies.delete('State');

  return res;
}
