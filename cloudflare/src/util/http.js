import { jwtVerify, SignJWT } from "jose";

/**
 * Sets an HTTP cookie on the response with security-first defaults.
 */
export function setCookie(response, name, value, options = {}) {
  response.headers.append("Set-Cookie",
    `${name}=${value}; ` +
    `${options.Domain ? `Domain=${options.Domain}; ` : ''}` +
    `Path=${options.Path || '/'};` +
    `${options.HttpOnly === false ? '' : ' HttpOnly;'}` +
    `${options.Secure === false ? '': ' Secure;'} ` +
    `${options.SameSite === false ? '' : `SameSite=${options.SameSite || 'Strict'};`}` +
    `${options.Expires ? ` Expires=${options.Expires};` : ''}` +
    `${options.MaxAge ? ` Max-Age=${options.MaxAge};` : ''}` +
    `${options.Partitioned ? ` Partitioned;` : ''}`
  );
}

/**
 * Deletes an HTTP cookie on the response.
 */
export function deleteCookie(response, name) {
  setCookie(
    response,
    name,
    '', {
      Path: "/",
      Secure: false,
      SameSite: false,
      Expires: "Thu, 01 Jan 1970 00:00:00 GMT",
    }
  );
}

export async function createSignedCookie(response, secret, name, payload, options = {}) {
  const key = new TextEncoder().encode(secret);

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(key);

  setCookie(response, name, jwt, options);
}

export async function validateSignedCookie(request, secret, name) {
  const jwt = request.cookies[name];
  if (!jwt) {
    request.error = `No signed cookie '${name}' found`;
    return null;
  }

  try {
    const key = new TextEncoder().encode(secret);

    const { payload } = await jwtVerify(jwt, key);
    return payload;

  } catch (error) {
    request.error = `Error validating signed cookie '${name}': ${error.message}`;
    return null;
  }
}

export function isValidUrl(url) {
  try {
    return new URL(url);
  } catch (_) {
    return null;
  }
}
