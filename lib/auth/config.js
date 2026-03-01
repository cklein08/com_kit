/**
 * Auth config – runtime (window.APP_CONFIG) first, then build-time env.
 * Matches awesomeportal's config pattern from utils/config.ts.
 */

function getConfig() {
  const runtime =
    typeof window !== 'undefined' && window.APP_CONFIG
      ? window.APP_CONFIG
      : {};
  return {
    ADOBE_CLIENT_ID:
      runtime.ADOBE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID ||
      '',
  };
}

export function getAdobeClientId() {
  return getConfig().ADOBE_CLIENT_ID;
}
