/**
 * Amplience configuration for Content Studio visualization and toolbar.
 * Used for storefront URLs ("visualisations") and Amplience environments (hub + VSE).
 * @see https://github.com/amplience/amplience-sfcc-composable-commerce/blob/main/config/amplience/default.js
 */

const defaultSkins = require("./amplience-skins");
const defaultThemes = require("./amplience-themes");

module.exports = {
  default: {
    hub: process.env.NEXT_PUBLIC_AMPLIENCE_HUB ?? "sfcccomposable",
  },
  envs: [
    // Add your Amplience environments for the Environments toolbar panel.
    // { name: "Live", hub: "myhub", vse: "https://myhub.vse.amplience.com" },
    // { name: "UAT", hub: "myhub-uat", vse: "https://myhub-uat.vse.amplience.com" },
  ],
  visualisations: defaultSkins,
  themes: defaultThemes,
};
