import { NextResponse } from 'next/server';
import { createSessionCookie, clearSessionCookie } from '@/lib/auth/session';

const ADOBE_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3';
const ADOBE_USERINFO_URL = 'https://ims-na1.adobelogin.com/ims/userinfo/v2';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/adobe/callback`;

  if (error) {
    const errorUrl = new URL('/', baseUrl);
    errorUrl.searchParams.set('auth_error', error);
    const res = NextResponse.redirect(errorUrl);
    res.cookies.set(clearSessionCookie().name, clearSessionCookie().value, clearSessionCookie().options);
    return res;
  }

  if (!code) {
    return NextResponse.redirect(new URL('/', baseUrl));
  }

  const clientId = process.env.ADOBE_CLIENT_ID;
  const clientSecret = process.env.ADOBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Adobe OAuth not configured.' },
      { status: 500 }
    );
  }

  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await fetch(ADOBE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error('Adobe token error:', tokenRes.status, errText);
    const errorUrl = new URL('/', baseUrl);
    errorUrl.searchParams.set('auth_error', 'token_exchange_failed');
    return NextResponse.redirect(errorUrl);
  }

  const tokens = await tokenRes.json();

  const userInfoRes = await fetch(ADOBE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  let user = { name: 'Adobe User', email: '', sub: tokens.sub || '' };
  if (userInfoRes.ok) {
    const userInfo = await userInfoRes.json();
    user = {
      name: userInfo.name || user.name,
      email: userInfo.email || '',
      sub: userInfo.sub || user.sub,
    };
  }

  const sessionCookie = createSessionCookie(user, tokens);
  const res = NextResponse.redirect(new URL('/', baseUrl));
  res.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);
  return res;
}
