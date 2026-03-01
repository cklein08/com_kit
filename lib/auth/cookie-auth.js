/**
 * Cookie auth fallback – when running on worker origins, user is considered
 * authenticated without a token (session handled by host).
 * Matches com_kit worker URLs: *.workers.dev and localhost:8787.
 */
export function isCookieAuth() {
  if (typeof window === 'undefined') return false;
  const origin = window.location.origin;
  return origin.endsWith('.workers.dev') || origin === 'http://localhost:8787';
}
