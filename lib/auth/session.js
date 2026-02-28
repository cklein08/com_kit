import { createHmac } from 'node:crypto';

const COOKIE_NAME = 'adobe_session';
const MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.ADOBE_SESSION_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET or ADOBE_SESSION_SECRET must be set for session signing');
  }
  return secret;
}

function sign(payload) {
  const secret = getSecret();
  const data = JSON.stringify(payload);
  const signature = createHmac('sha256', secret).update(data).digest('base64url');
  return Buffer.from(JSON.stringify({ data: payload, sig: signature })).toString('base64url');
}

function verify(cookieValue) {
  if (!cookieValue) return null;
  try {
    const secret = getSecret();
    const decoded = JSON.parse(Buffer.from(cookieValue, 'base64url').toString('utf8'));
    const expectedSig = createHmac('sha256', secret).update(JSON.stringify(decoded.data)).digest('base64url');
    if (decoded.sig !== expectedSig) return null;
    return decoded.data;
  } catch {
    return null;
  }
}

export function createSessionCookie(user, tokens) {
  const payload = {
    user: { name: user.name, email: user.email, sub: user.sub },
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (tokens.expires_in || 86400) * 1000,
  };
  return {
    name: COOKIE_NAME,
    value: sign(payload),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    },
  };
}

export function getSessionFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? verify(match[1]) : null;
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    },
  };
}
