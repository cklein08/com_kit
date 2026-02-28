import { NextResponse } from 'next/server';

/**
 * Redirects the user to Adobe's identity system (id.adobe.com) to sign in.
 * This is not OAuth: we do not exchange tokens or receive user identity.
 * For the app to know who signed in, see docs/adobe-authentication.md.
 */
const ADOBE_SIGN_IN_URL = 'https://id.adobe.com';

export function GET() {
  return NextResponse.redirect(ADOBE_SIGN_IN_URL);
}
