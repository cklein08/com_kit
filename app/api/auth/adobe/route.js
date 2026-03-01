import { NextResponse } from 'next/server';

/**
 * Sign in with Adobe — same auth type as AEM Cloud Service author
 * (https://author-*.adobeaemcloud.com). Redirects to Adobe IMS authorize;
 * user signs in at Adobe, then IMS redirects back to our callback with an
 * authorization code that we exchange for tokens and user info.
 */
const ADOBE_AUTHORIZE_URL = 'https://ims-na1.adobelogin.com/ims/authorize/v2';
const SCOPES = 'openid,email,profile,offline_access';

export function GET(request) {
  const clientId = process.env.ADOBE_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/adobe/callback`;
  const orgId = process.env.ADOBE_IMS_ORG_ID;

  if (!clientId) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const errorUrl = new URL('/', baseUrl);
    errorUrl.searchParams.set('auth_error', 'not_configured');
    return NextResponse.redirect(errorUrl);
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
    response_type: 'code',
  });

  if (orgId) {
    params.set('org_id', orgId);
  }

  const authorizeUrl = `${ADOBE_AUTHORIZE_URL}?${params.toString()}`;
  return NextResponse.redirect(authorizeUrl);
}
