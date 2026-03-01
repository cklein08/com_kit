import { json, Router } from 'itty-router';
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import {
  createSignedCookie,
  deleteCookie,
  isValidUrl,
  setCookie,
  validateSignedCookie,
} from './util/http.js';

const AUTH_PREFIX = '/auth';

const COOKIE_SESSION = 'Session';
const COOKIE_STATE = 'State';
const ORIGINAL_URL_PARAM = 'url';

const REQUIRED_ENV_VARS = [
  'MICROSOFT_ENTRA_TENANT_ID',
  'MICROSOFT_ENTRA_CLIENT_ID',
  'MICROSOFT_ENTRA_JWKS_URL',
  'COOKIE_SECRET',
];

async function getCookieSecret(env) {
  if (typeof env.COOKIE_SECRET?.get === 'function') {
    return await env.COOKIE_SECRET.get();
  }
  return env.COOKIE_SECRET;
}

async function createSessionJWT(request, idToken, env) {
  const payload = {
    sid: crypto.randomUUID(),
    sub: idToken.oid,
    name: idToken.name,
    email: idToken.email,
    country: idToken.ctry,
    usertype: idToken.usertype,
  };

  const secret = await getCookieSecret(env);
  const key = new TextEncoder().encode(secret);

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(request.uri.origin)
    .setAudience(env.MICROSOFT_ENTRA_CLIENT_ID)
    .setExpirationTime(env.SESSION_COOKIE_EXPIRATION || '6h')
    .setNotBefore("0m")
    .sign(key);

  return jwt;
}

async function validateSessionJWT(request, env, sessionJWT) {
  try {
    const secret = await getCookieSecret(env);
    const key = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(sessionJWT, key, {
      issuer: request.uri.origin,
      audience: env.MICROSOFT_ENTRA_CLIENT_ID,
      clockTolerance: 5,
    });
    return payload;

  } catch (error) {
    request.error = `Invalid ${COOKIE_SESSION} cookie: ${error.message}`;
    return null;
  }
}

async function validateMicrosoftSignInCallback(request, state) {
  const formData = await request.formData();
  if (formData.has('error')) {
    request.error = `Microsoft OIDC error: ${formData.get('error')} - ${formData.get('error_description')}`;
    return null;
  }

  if (!formData.has('id_token')) {
    request.error = 'Microsoft OIDC error: No id_token in form data';
    return null;
  }

  if (formData.get('state') !== state) {
    request.error = 'OIDC error: Invalid state parameter';
    return null;
  }

  return formData;
}

async function validateIdToken(request, rawIdToken, env, nonce) {
  const jwksUrl = env.MICROSOFT_ENTRA_JWKS_URL || 'https://login.microsoftonline.com/common/discovery/keys';
  const JWKS = createRemoteJWKSet(new URL(jwksUrl));

  try {
    const { payload } = await jwtVerify(rawIdToken, JWKS, {
      audience: env.MICROSOFT_ENTRA_CLIENT_ID,
      issuer: `https://login.microsoftonline.com/${env.MICROSOFT_ENTRA_TENANT_ID}/v2.0`,
    });

    if (payload.nonce !== nonce) {
      request.error = `OIDC error: Invalid nonce in id_token: ${payload.nonce}`;
      return null;
    }
    if (payload.tid !== env.MICROSOFT_ENTRA_TENANT_ID) {
      request.error = `OIDC error: Invalid tenant (tid) in id_token: ${payload.tid}`;
      return null;
    }
    return payload;

  } catch (error) {
    request.error = `OIDC error: Invalid id_token: ${error.message}`;
    return null;
  }
}

function unauthorized(request) {
  if (request.error) {
    console.error(request.error);
    return new Response(`Unauthorized - ${request.error}`, { status: 401 });
  }
  return new Response('Unauthorized', { status: 401 });
}

function redirect(url, status = 302) {
  const response = new Response(null, { status });
  response.headers.set('Location', url);
  return response;
}

function redirectToLoginPage(request, env, page = env.LOGIN_PAGE) {
  const loginPage = new URL(request.uri.origin);
  loginPage.pathname = page || `${AUTH_PREFIX}/login`;

  const originalUrl = new URL(request.url);
  const url = originalUrl.pathname + originalUrl.search;
  if (url !== '/') {
    loginPage.searchParams.append(ORIGINAL_URL_PARAM, url);
  }

  const response = redirect(loginPage.href);
  deleteCookie(response, COOKIE_SESSION);

  return response;
}

export async function withAuthentication(request, env) {
  request.uri = new URL(request.url);

  if (env.DISABLE_AUTHENTICATION === 'true') {
    request.session = {};
    return;
  }

  const sessionJWT = request.cookies[COOKIE_SESSION];
  if (!sessionJWT) {
    return redirectToLoginPage(request, env);
  }

  const session = await validateSessionJWT(request, env, sessionJWT);
  if (!session) {
    return redirectToLoginPage(request, env, `${AUTH_PREFIX}/login`);
  }

  request.session = session;
}

export const authRouter = Router({
  base: AUTH_PREFIX,
  route: `${AUTH_PREFIX}/*`,
  before: [
    async (request, env) => {
      request.uri = new URL(request.url);

      const secret = await getCookieSecret(env);
      const missing = REQUIRED_ENV_VARS.filter((v) => {
        if (v === 'COOKIE_SECRET') return !secret;
        return !env[v];
      });
      if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        return new Response('Service Unavailable', { status: 503 });
      }
    }
  ],
});

authRouter
  .get('/login', async (request, env) => {
    const redirectUrl = new URL(request.uri.origin);
    redirectUrl.pathname = `${AUTH_PREFIX}/callback`;

    const url = new URL(request.url);
    let originalUrl = url.searchParams.get(ORIGINAL_URL_PARAM) || url.searchParams.get('url');
    if (!originalUrl && request.headers.get('Referer')) {
      const referer = isValidUrl(request.headers.get('Referer'));
      if (referer && referer.origin === request.uri.origin) {
        originalUrl = referer.searchParams.get(ORIGINAL_URL_PARAM) || referer.pathname + referer.search;
      }
    }

    const state = {
      state: crypto.randomUUID() + (originalUrl ? `|${originalUrl}` : ''),
      nonce: crypto.randomUUID(),
    };

    const authorizeUrl = `https://login.microsoftonline.com/${env.MICROSOFT_ENTRA_TENANT_ID}/oauth2/v2.0/authorize?` +
      new URLSearchParams({
        client_id: env.MICROSOFT_ENTRA_CLIENT_ID,
        response_type: 'id_token',
        redirect_uri: redirectUrl.href,
        response_mode: 'form_post',
        scope: 'openid profile',
        state: state.state,
        nonce: state.nonce,
      });

    const response = redirect(authorizeUrl);

    const userAgent = request.headers.get('User-Agent');
    const secret = await getCookieSecret(env);
    await createSignedCookie(response, secret, COOKIE_STATE, state, {
      SameSite: 'None',
      Secure: userAgent?.includes('Chrome') || userAgent?.includes('Firefox') || request.uri.hostname !== 'localhost',
      MaxAge: 60 * 10,
    });
    return response;
  })

  .post('/callback', async (request, env) => {
    const secret = await getCookieSecret(env);
    const state = await validateSignedCookie(request, secret, COOKIE_STATE);
    if (!state) {
      return unauthorized(request);
    }

    const formData = await validateMicrosoftSignInCallback(request, state.state);
    if (!formData) {
      return unauthorized(request);
    }

    const idToken = await validateIdToken(request, formData.get('id_token'), env, state.nonce);
    if (!idToken) {
      return unauthorized(request);
    }

    const sessionJWT = await createSessionJWT(request, idToken, env);

    let redirectUrl = `${request.uri.origin}/`;
    const originalUrl = state.state.split('|')[1];
    if (
      originalUrl?.startsWith('/') &&
      originalUrl !== env.LOGIN_PAGE &&
      originalUrl !== `${AUTH_PREFIX}/login`
    ) {
      redirectUrl = `${request.uri.origin}${originalUrl}`;
    }

    const response = redirect(redirectUrl);
    setCookie(response, COOKIE_SESSION, sessionJWT, {
      SameSite: 'Lax',
      Secure: request.uri.hostname !== 'localhost',
    });
    deleteCookie(response, COOKIE_STATE);
    return response;
  })

  .get('/user', withAuthentication, (request) => {
    const user = request.session;
    return json({
      name: user.name,
      email: user.email,
      country: user.country,
      usertype: user.usertype,
      sessionExpiresInSec: user.exp && Math.floor((user.exp * 1000 - Date.now()) / 1000),
    });
  })

  .get('/logout', withAuthentication, (request, env) => {
    const logoutUrl = `https://login.microsoftonline.com/${env.MICROSOFT_ENTRA_TENANT_ID}/oauth2/logout?` +
      new URLSearchParams({
        post_logout_redirect_uri: `${request.uri.origin}/`,
      });

    const response = redirect(logoutUrl);
    deleteCookie(response, COOKIE_SESSION);
    return response;
  })

  .all('*', () => new Response('Not Found', { status: 404 }));
