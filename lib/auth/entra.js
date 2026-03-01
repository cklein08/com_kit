/**
 * Microsoft Entra ID (Azure AD) authentication - adapted from awesomeportal.
 * OIDC flow with id_token, JWT session cookie, and route protection.
 */
import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';

const COOKIE_SESSION = 'Session';
const COOKIE_STATE = 'State';
const ORIGINAL_URL_PARAM = 'url';

const REQUIRED_ENV_VARS = [
  'MICROSOFT_ENTRA_TENANT_ID',
  'MICROSOFT_ENTRA_CLIENT_ID',
  'MICROSOFT_ENTRA_JWKS_URL',
  'AUTH_SECRET',
];

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.ADOBE_SESSION_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET or ADOBE_SESSION_SECRET must be set for session signing');
  }
  return secret;
}

function isEntraConfigured() {
  try {
    return (
      process.env.MICROSOFT_ENTRA_TENANT_ID &&
      process.env.MICROSOFT_ENTRA_CLIENT_ID &&
      process.env.MICROSOFT_ENTRA_JWKS_URL &&
      (process.env.AUTH_SECRET || process.env.ADOBE_SESSION_SECRET)
    );
  } catch {
    return false;
  }
}

export { COOKIE_SESSION, COOKIE_STATE, ORIGINAL_URL_PARAM, REQUIRED_ENV_VARS, isEntraConfigured };

/**
 * Create a session JWT from Microsoft id_token payload.
 */
export async function createSessionJWT(idToken, origin) {
  const payload = {
    sid: crypto.randomUUID(),
    sub: idToken.oid,
    name: idToken.name,
    email: idToken.email,
    country: idToken.ctry,
    usertype: idToken.usertype,
  };

  const key = new TextEncoder().encode(getSecret());
  const expiration = process.env.SESSION_COOKIE_EXPIRATION || '6h';

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(origin)
    .setAudience(process.env.MICROSOFT_ENTRA_CLIENT_ID)
    .setExpirationTime(expiration)
    .setNotBefore('0m')
    .sign(key);

  return jwt;
}

/**
 * Validate session JWT and return payload or null.
 */
export async function validateSessionJWT(sessionJWT, origin) {
  if (!sessionJWT) return null;
  try {
    const key = new TextEncoder().encode(getSecret());
    const { payload } = await jwtVerify(sessionJWT, key, {
      issuer: origin,
      audience: process.env.MICROSOFT_ENTRA_CLIENT_ID,
      clockTolerance: 5,
    });
    return payload;
  } catch {
    return null;
  }
}

/**
 * Create signed state cookie for OIDC flow (state + nonce).
 */
export async function createStateJWT(state, nonce) {
  const key = new TextEncoder().encode(getSecret());
  const jwt = await new SignJWT({ state, nonce })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(key);
  return jwt;
}

/**
 * Validate state cookie and return payload or null.
 */
export async function validateStateJWT(stateJWT) {
  if (!stateJWT) return null;
  try {
    const key = new TextEncoder().encode(getSecret());
    const { payload } = await jwtVerify(stateJWT, key);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Validate Microsoft id_token from OIDC callback.
 */
export async function validateIdToken(rawIdToken, nonce) {
  const jwksUrl =
    process.env.MICROSOFT_ENTRA_JWKS_URL ||
    `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_TENANT_ID}/discovery/keys`;
  const JWKS = createRemoteJWKSet(new URL(jwksUrl));

  try {
    const { payload } = await jwtVerify(rawIdToken, JWKS, {
      audience: process.env.MICROSOFT_ENTRA_CLIENT_ID,
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_TENANT_ID}/v2.0`,
    });

    if (payload.nonce !== nonce) return null;
    if (payload.tid !== process.env.MICROSOFT_ENTRA_TENANT_ID) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Build Microsoft Entra authorize URL for login redirect.
 */
export function getAuthorizeUrl(redirectUri, state, nonce, originalUrl) {
  const stateValue = state + (originalUrl ? `|${originalUrl}` : '');
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_ENTRA_CLIENT_ID,
    response_type: 'id_token',
    redirect_uri: redirectUri,
    response_mode: 'form_post',
    scope: 'openid profile',
    state: stateValue,
    nonce,
  });
  return `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Build Microsoft Entra logout URL.
 */
export function getLogoutUrl(postLogoutRedirectUri) {
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
  });
  return `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_TENANT_ID}/oauth2/logout?${params.toString()}`;
}
