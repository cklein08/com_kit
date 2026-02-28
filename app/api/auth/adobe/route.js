import { NextResponse } from 'next/server';

const ADOBE_AUTHORIZE_URL = 'https://ims-na1.adobelogin.com/ims/authorize/v2';
const SCOPES = 'openid,email,profile';

export function GET(request) {
  const clientId = process.env.ADOBE_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/adobe/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Adobe OAuth not configured. Set ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET.' },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
    response_type: 'code',
  });

  const authorizeUrl = `${ADOBE_AUTHORIZE_URL}?${params.toString()}`;
  return NextResponse.redirect(authorizeUrl);
}
