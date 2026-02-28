---
name: Amplience theme picker accordion
overview: Add a new accordion below "Sites" that lets authors pick a full-site color palette (e.g. all blue, all green, blue-green) applied via CSS variables — like the cohesive palettes in blue-green website examples (e.g. ColibriWP).
todos:
  - id: theme-library
    content: Add config/amplience-themes.js with Default, Blue, Green (and optional Blue-Green) palette definitions
  - id: globals-css
    content: Add [data-amplience-theme="..."] overrides in globals.css for full palette (background, foreground, primary, secondary, card, muted, accent, etc.)
  - id: theme-picker-panel
    content: Add theme-picker-panel.jsx; list themes, on select set data-amplience-theme on document; optional localStorage
  - id: config-api-client
    content: Expose themes in config/amplience.js, API route, and config-client.js
  - id: toolbar-accordion
    content: Add Theme accordion below Sites in toolbar index; pass themes to ThemePickerPanel
isProject: false
---

# Amplience theme/skin picker accordion (below Sites)

## What “all blue” / “all green” means

You want **full-site color palettes**, not just a single background + text. Examples: [Blue Green Color Palette for Websites (ColibriWP)](https://colibriwp.com/blog/website-blue-green-color-palette/) — cohesive themes where background, text, primary, secondary, and accents follow one palette so the **whole site** feels “all green” or “all blue” (or a blue-green combination).

So each theme in the picker will override the **full set** of design tokens used in the app: `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--card`, `--muted`, `--accent`, `--border`, etc., in [app/globals.css](app/globals.css). That way nav, cards, buttons, and text all follow the chosen palette.

## Ensuring the theme affects all components on the page

- **Apply at document root:** Set `data-amplience-theme` on `document.documentElement` (the `<html>` element). That is the top of the cascade, so every node on the page is inside it and inherits the overridden variables.
- **Override the same tokens the app uses:** The codebase already uses Tailwind semantic classes and CSS variables from [app/globals.css](app/globals.css) (e.g. `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`). Theme CSS will override **those same** variables (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, etc.) inside `[data-amplience-theme="..."]`. Because all components that use these utilities read from the same variables, **every such component will update** when the theme changes — no per-component changes needed.
- **Scope of overrides:** In `globals.css`, define each theme as `[data-amplience-theme="blue"]`, `[data-amplience-theme="green"]`, etc., and set the full set of variables (background, foreground, primary, secondary, card, muted, accent, border, input, ring, sidebar-*, etc.) so that nav, product cards, buttons, forms, sidebar, and any other UI that uses these tokens automatically picks up the new palette.
- **Components with hardcoded colors:** Any component that uses inline hex/rgb or non-token Tailwind classes (e.g. `bg-[#1a202c]`) will not change with the theme. The plan assumes the existing app uses the design tokens (as in globals.css); if we find components that don’t, we can either switch them to token-based classes or add theme-specific overrides for those selectors so the theme still affects them.

## Goal

- **Keep** the existing "Sites" accordion and its props unchanged.
- **Add** a new accordion **below** "Sites" titled e.g. "Theme" that lists palette options (Default, Blue, Green, optionally Blue-Green). Selecting one applies that **full palette** to the current site via `data-amplience-theme="{id}"` on the document root.

## Implementation

### 1. Theme library — `config/amplience-themes.js`

- Export an array of themes, e.g.:
  - `{ id: "default", name: "Default", description: "Default site palette" }`
  - `{ id: "blue", name: "Blue", description: "Blue palette, white text" }`
  - `{ id: "green", name: "Green", description: "Green palette, white text" }`
  - Optional: `{ id: "blue-green", name: "Blue-Green", description: "Blue and green palette" }`
- IDs are used as `data-amplience-theme` values; CSS holds the actual HSL values for each palette.

### 2. CSS — full-palette overrides in `app/globals.css`

- Add blocks **after** the existing `:root` / `.dark` block:
  - `[data-amplience-theme="blue"]` — set all relevant variables to a blue-dominant palette (e.g. blue background, white/light text, blue primary, etc.), using the same variable names as `:root`.
  - `[data-amplience-theme="green"]` — green-dominant palette (green background, white text, green primary, etc.).
  - Optional: `[data-amplience-theme="blue-green"]` — blend (e.g. blue background with green accents, or vice versa).
- For "default", removing the attribute (or not setting it) keeps the existing `:root` palette. No extra CSS needed for default.

### 3. Theme picker panel — `components/amplience/toolbar/theme-picker-panel.jsx`

- Props: `themes` (array from library).
- Render a button or option per theme (show name + short description).
- On click: `document.documentElement.setAttribute("data-amplience-theme", theme.id)`; for "default", remove the attribute.
- Optional: persist choice in `localStorage` and reapply on mount so the palette sticks across navigations.

### 4. Config and API

- [config/amplience.js](config/amplience.js): add `themes: require("./amplience-themes")`.
- [app/api/amplience/config/route.js](app/api/amplience/config/route.js): include `themes` in the JSON response.
- [lib/amplience/config-client.js](lib/amplience/config-client.js): add `themes` to the client fallback (import or inline the same list).

### 5. Toolbar

- [components/amplience/toolbar/index.jsx](components/amplience/toolbar/index.jsx): add a fourth accordion item after Sites (`value: "3"`, title "Theme", `Component: ThemePickerPanel`, `props: { themes }`). Get `themes` from serverConfig/staticConfig like `visualisations`. Optionally include `"3"` in `openedPanels` default.

## Files to add

- `config/amplience-themes.js` — theme definitions (id, name, description).
- `components/amplience/toolbar/theme-picker-panel.jsx` — UI to pick theme and set `data-amplience-theme` on document.

## Files to modify

- `app/globals.css` — add `[data-amplience-theme="blue"]`, `[data-amplience-theme="green"]` (and optional blue-green) with **full** variable overrides (background, foreground, primary, secondary, card, muted, accent, border, etc.) so the whole site uses the palette.
- `config/amplience.js` — expose `themes`.
- `app/api/amplience/config/route.js` — return `themes`.
- `lib/amplience/config-client.js` — add `themes` fallback.
- `components/amplience/toolbar/index.jsx` — add Theme accordion below Sites.

## Summary

Themes are **full-site palettes** (all blue, all green, or blue-green style) as in the [ColibriWP blue-green palette article](https://colibriwp.com/blog/website-blue-green-color-palette/). The picker applies them by setting `data-amplience-theme` on the document and defining matching CSS variable overrides for the entire design token set in `globals.css`.
