# Amplience Content Studio setup

This app supports **Amplience Content Studio** visualization and the **toolbar** (“site tools”) so authors can preview content and switch environments/skins when editing. Amplience is **combined with** existing AEM and Adobe Commerce: AEM and Adobe Universal Editor are unchanged; Amplience adds PDP content, optional slots, and the visualization route.

## How Amplience fits with existing features

- **AEM** — Still drives home and slug pages (screen by path). Rendered by `ModelManager`; edited in **Adobe Universal Editor** (`data-aue-resource`).
- **Adobe Commerce** — Still the source of product and catalog data; product pages use your existing `ProductDetail` component.
- **Amplience** — Additive:
  - **Product pages** (`/product/:slug`): Existing `ProductDetail` renders first; then any **Amplience PDP content** (key `pdp/content/{SKU}`) is rendered below via `AmplienceWrapper`.
  - **Home page** (optional): You can add Amplience slots (e.g. `home/slot/top`) alongside AEM blocks.
  - **Visualization** — Route `/visualization/:hubName/:contentId` loads a single Amplience content item and the toolbar for editing in Content Studio.
- **Editors** — Use **Adobe UE** for AEM content; use **Amplience Content Studio** (and the storefront toolbar when in visualization) for Amplience content.

## Configuration

1. **Environment variables** (see `.env.example`):

   - `NEXT_PUBLIC_AMPLIENCE_HUB` — Your Amplience hub name (used for Content Delivery API and visualization URLs).
   - `NEXT_PUBLIC_APP_URL` — Base URL of this storefront (e.g. `http://localhost:3000` or your deployed URL). Used when registering visualization URLs in Amplience.

2. **Amplience config** (`config/amplience.js`):

   - `default.hub` — Default hub (falls back to env).
   - `envs` — List of `{ name, hub, vse }` for the **Environments** toolbar panel (switch UAT/Live etc.).
   - `visualisations` — List of `{ name, default, url }` storefront URLs for “skinning” (which site to preview).

## Visualization URL in Content Studio

For each **Content Type** in Amplience that should open this storefront in the editor:

1. In Amplience, go to the content type **Visualizations** tab.
2. Set the visualization URL to:

   ```
   {{NEXT_PUBLIC_APP_URL}}/visualization/{{hub.name}}/{{content.sys.id}}?vse={{vse.domain}}
   ```

   Example for local dev:

   ```
   http://localhost:3000/visualization/{{hub.name}}/{{content.sys.id}}?vse={{vse.domain}}
   ```

3. Optional: add `&locale= en-US` (or your locale) to the URL template if you use locale in the API.

When an author opens that content in Content Studio, the storefront loads in an iframe at that URL. The **toolbar** (Visualisation + Environments panels) appears so they can copy VSE/hub/locale/content ID and switch environment/site.

## Toolbar (“site tools”)

- **Visualisation** — Shows and copy Hub name, VSE, locale, content ID.
- **Environments** — If `config/amplience.js` has `envs` configured, authors can switch to another Amplience environment (reloads with that VSE).

The toolbar is rendered when the page URL includes a `vse` query parameter (when opened from Content Studio, or when testing on localhost).

### Show the authoring/skinning tools on localhost

To see the toolbar (Visualisation + Environments = skinning) on **http://localhost:3000** without Content Studio:

1. Add `?vse=` and your Amplience VSE domain to any page, for example:
   ```
   http://localhost:3000/?vse=your-hub.staging.bigcontent.io
   ```
2. Optional query params: `&hub=your-hub` and `&contentId=some-id` and `&locale=en-US` so the Visualisation panel shows full values.
3. The toolbar appears on the right; open the **Visualisation** and **Environments** panels to use the skinning/site tools. Use **Exit** in the toolbar to clear `vse` and return to normal view.

## Storefront: PDP, home slot, and nav

- **Home page:** The home route (`/`) is driven by **AEM** only (no override). To add an optional Amplience slot (e.g. `home/slot/top`), render `<AmplienceWrapper fetch={{ key: "home/slot/top" }} />` in `app/page.jsx` where you want it; use delivery key `home/slot/top` in Amplience.
- **PDP content:** Product pages under `/product/:slug` use existing **Adobe Commerce** data and `ProductDetail`; they also fetch Amplience content by key `pdp/content/{SKU}` (slug uppercased). If the Product PDP content type returns `active: true` and a `content` array, each item is rendered with `AmplienceWrapper` (hero, banner, etc.) below the product detail. Use delivery key format `pdp/content/{SKU}` in Amplience.
- **Nav / slots:** To drive header or footer from Amplience, fetch by delivery key (e.g. `main-nav`, `footer-nav`) via `/api/amplience/content?key=main-nav` and render in your nav component. For hierarchy-based nav, extend `lib/amplience/client.js` with a hierarchy fetch (Filter API by parent id) or use slot content with a list structure.

## References

- [Amplience SFCC Composable Commerce](https://github.com/amplience/amplience-sfcc-composable-commerce) — source of patterns (visualization route, toolbar, config).
- [Amplience visualization docs](https://amplience.com/docs/integration/visualizations.html) — setting content type visualization URLs.
