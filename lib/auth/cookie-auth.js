/**
 * Cookie auth fallback – when running on worker origins, user is considered
 * authenticated without a token (session handled by host).
 * Matches awesomeportal pattern: adobeaem.workers.dev and localhost:8787.
 * Also supports broader *.workers.dev for flexible deployments.
 */
export function isCookieAuth() {
  if (typeof window === 'undefined') return false;
  const origin = window.location.origin;
  return (
    origin.endsWith('adobeaem.workers.dev') ||
    origin === 'http://localhost:8787' ||
    origin.endsWith('.workers.dev')
  );
}
