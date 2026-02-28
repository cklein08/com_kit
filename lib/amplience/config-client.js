/**
 * Client-safe Amplience config for use in browser (e.g. toolbar).
 * Do not import lib/amplience/client.js in client components — it uses Node require() and dc-delivery-sdk-js.
 */

const DEFAULT_HUB = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AMPLIENCE_HUB
  ? process.env.NEXT_PUBLIC_AMPLIENCE_HUB
  : "sfcccomposable";

const DEFAULT_APP_URL = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL
  : "http://localhost:3000";

export function getAmplienceConfig() {
  return {
    default: { hub: DEFAULT_HUB },
    envs: [],
    visualisations: [
      { name: "Localhost", default: true, url: DEFAULT_APP_URL },
    ],
  };
}
