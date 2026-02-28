/**
 * Amplience configuration for Content Studio visualization and toolbar.
 * Used for storefront URLs ("visualisations") and Amplience environments (hub + VSE).
 * @see https://github.com/amplience/amplience-sfcc-composable-commerce/blob/main/config/amplience/default.js
 */

module.exports = {
  default: {
    hub: process.env.NEXT_PUBLIC_AMPLIENCE_HUB ?? "sfcccomposable",
  },
  envs: [
    // Add your Amplience environments for the Environments toolbar panel.
    // { name: "Live", hub: "myhub", vse: "https://myhub.vse.amplience.com" },
    // { name: "UAT", hub: "myhub-uat", vse: "https://myhub-uat.vse.amplience.com" },
  ],
  visualisations: [
    {
      name: "Localhost",
      default: true,
      url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    },
    // { name: "Production", default: false, url: "https://your-storefront.com" },
    // { name: "UAT", default: false, url: "https://uat.your-storefront.com" },
  ],
};
