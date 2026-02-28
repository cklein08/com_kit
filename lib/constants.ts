export const ACO_URL =
  "https://na1-sandbox.api.commerce.adobe.com/NZwP3wKPFXBCTLGqxYWZne/graphql";
export const CATALOG_VIEW_ID = "426ffe32-e0a9-4c53-8ec9-3f7118cbf6b2";
export const DEFAULT_LOCALE = "en-US";
export const ALL_PRICE_BOOKS = ["wknd_global", "wknd_vip"];
export const DEFAULT_PRICE_BOOK = "wknd_global";

/** Default AEM author URL for Universal Editor. Override with NEXT_PUBLIC_AEM_EDITOR_URL (e.g. https://localhost:8443 for local AEM SDK). */
export const DEFAULT_AEM_EDITOR_URL =
  process.env.NEXT_PUBLIC_AEM_EDITOR_URL ??
  "https://author-p124903-e1367755.adobeaemcloud.com";

/** Default AEM project name when app is opened in Universal Editor (iframe) and no value is in localStorage. Override with NEXT_PUBLIC_AEM_PROJECT. */
export const DEFAULT_AEM_PROJECT =
  process.env.NEXT_PUBLIC_AEM_PROJECT ?? "v0";

/** Universal Editor CORS script URL. Override with NEXT_PUBLIC_UE_CORS_SCRIPT_URL when using a local UE service (e.g. https://localhost:8001/cors.js). */
export const UE_CORS_SCRIPT_URL =
  process.env.NEXT_PUBLIC_UE_CORS_SCRIPT_URL ??
  "https://universal-editor-service.adobe.io/cors.js";

/** Amplience: default hub name for Content Delivery API. Override with NEXT_PUBLIC_AMPLIENCE_HUB. */
export const AMPLIENCE_HUB =
  process.env.NEXT_PUBLIC_AMPLIENCE_HUB ?? "sfcccomposable";

/** Amplience: base URL for this storefront (used in visualization URLs). Override with NEXT_PUBLIC_APP_URL. */
export const AMPLIENCE_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Locale segments that can be read from the URL path (e.g. /us/en/magazine → locale "us/en", content "magazine").
 * Each entry is an array of path segments that form a locale; the rest of the slug is the content path.
 */
export const URL_LOCALE_SEGMENTS: readonly (readonly string[])[] = [
  ["us", "en"],
  ["en"],
];
