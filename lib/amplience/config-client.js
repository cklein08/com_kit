/**
 * Client-safe Amplience config for use in browser (e.g. toolbar).
 * Do not import lib/amplience/client.js in client components — it uses Node require() and dc-delivery-sdk-js.
 */

import defaultSkins from "@/config/amplience-skins";
import defaultThemes from "@/config/amplience-themes";

const DEFAULT_HUB = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_AMPLIENCE_HUB
  ? process.env.NEXT_PUBLIC_AMPLIENCE_HUB
  : "sfcccomposable";

export function getAmplienceConfig() {
  return {
    default: { hub: DEFAULT_HUB },
    envs: [],
    visualisations: defaultSkins,
    themes: defaultThemes,
  };
}
