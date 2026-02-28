/**
 * Pre-built library of Amplience storefront skins (visualisations).
 * Used by the toolbar Sites panel so authors can open the current page on another storefront URL.
 * URLs can use env vars so the same list works across dev/stage/prod.
 *
 * @see config/amplience.js
 * @see components/amplience/toolbar/sites-panel.jsx
 */

const APP_URL = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL
  : "http://localhost:3000";

/**
 * Default list of storefront skins (sample library). Override or extend in config/amplience.js if needed.
 * Each item: { name: string, default?: boolean, url: string }
 * Set NEXT_PUBLIC_*_APP_URL in .env to override placeholder URLs.
 */
const defaultSkins = [
  {
    name: "Localhost",
    default: true,
    url: APP_URL,
  },
  {
    name: "Development",
    default: false,
    url: typeof process !== "undefined" && process.env?.NEXT_PUBLIC_DEV_APP_URL
      ? process.env.NEXT_PUBLIC_DEV_APP_URL
      : "https://dev.your-storefront.com",
  },
  {
    name: "Staging",
    default: false,
    url: typeof process !== "undefined" && process.env?.NEXT_PUBLIC_STAGING_APP_URL
      ? process.env.NEXT_PUBLIC_STAGING_APP_URL
      : "https://staging.your-storefront.com",
  },
  {
    name: "QA",
    default: false,
    url: typeof process !== "undefined" && process.env?.NEXT_PUBLIC_QA_APP_URL
      ? process.env.NEXT_PUBLIC_QA_APP_URL
      : "https://qa.your-storefront.com",
  },
  {
    name: "UAT",
    default: false,
    url: typeof process !== "undefined" && process.env?.NEXT_PUBLIC_UAT_APP_URL
      ? process.env.NEXT_PUBLIC_UAT_APP_URL
      : "https://uat.your-storefront.com",
  },
  {
    name: "Preview",
    default: false,
    url: typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PREVIEW_APP_URL
      ? process.env.NEXT_PUBLIC_PREVIEW_APP_URL
      : "https://preview.your-storefront.com",
  },
  {
    name: "Production",
    default: false,
    url: typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PROD_APP_URL
      ? process.env.NEXT_PUBLIC_PROD_APP_URL
      : "https://your-storefront.com",
  },
  {
    name: "Demo",
    default: false,
    url: typeof process !== "undefined" && process.env?.NEXT_PUBLIC_DEMO_APP_URL
      ? process.env.NEXT_PUBLIC_DEMO_APP_URL
      : "https://demo.your-storefront.com",
  },
];

module.exports = defaultSkins;
