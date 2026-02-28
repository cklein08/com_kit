/**
 * Pre-built library of Amplience visual themes (full-site color palettes).
 * Used by the toolbar Theme picker so authors can preview the site in different palettes
 * (e.g. blue, green, blue-green). Applied via data-amplience-theme on document root.
 *
 * @see components/amplience/toolbar/theme-picker-panel.jsx
 * @see app/globals.css (data-amplience-theme overrides)
 */

/**
 * Theme definitions. id is used as data-amplience-theme value; "default" means no attribute.
 * CSS for each theme lives in app/globals.css.
 */
const defaultThemes = [
  {
    id: "default",
    name: "Default",
    description: "Default site palette",
  },
  {
    id: "blue",
    name: "Blue",
    description: "Blue palette, white text",
  },
  {
    id: "green",
    name: "Green",
    description: "Green palette, white text",
  },
  {
    id: "blue-green",
    name: "Blue-Green",
    description: "Blue and green palette",
  },
];

module.exports = defaultThemes;
