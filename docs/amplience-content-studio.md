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

1. **Show the popup (toolbar)**  
   Add `?vse=` to any page so the toolbar appears on the right, e.g.:
   ```
   http://localhost:3000/?vse=your-hub.staging.bigcontent.io
   ```
   Optional: `&hub=...` and `&contentId=...` and `&locale=en-US` so the **Visualisation** panel shows full values.

2. **Enable skinning (Environments + Sites)**  
   The toolbar has three panels:
   - **Visualisation** — Always shown when `vse` is set; copy VSE, hub, locale, content ID.
   - **Environments** — Shown only if you add **envs** in `config/amplience.js`. Use it to switch Amplience environment (e.g. Live vs UAT); the page reloads with the selected VSE.
   - **Sites** — Shown when **visualisations** exist (default: Localhost). Use it to open the current page on another storefront URL (e.g. Production, UAT) in a new tab (skinning).

   **What to do next:**
   - Edit **`config/amplience.js`** and uncomment or add entries:
     - **`envs`** — One object per environment, e.g. `{ name: "Live", hub: "myhub", vse: "https://myhub.vse.amplience.com" }`. Restart the dev server so the API serves the new config. Then the **Environments** panel appears and you can switch env.
     - **`visualisations`** — One object per site, e.g. `{ name: "Production", default: false, url: "https://your-storefront.com" }`. The **Sites** panel will list them; clicking a site opens the same path on that URL in a new tab.
   - Visit **http://localhost:3000/?vse=...** again. The toolbar shows **Visualisation** (always), **Environments** (if envs are set), and **Sites** (Localhost + any you added). Use **Exit** to clear `vse` and close the toolbar.

## Product Carousel (home page)

The home page can show a **product carousel** driven by Amplience content so authors can choose which product line appears (search phrase, category, or a list of SKUs).

1. **Content type:** In Amplience, create a content type **Product Carousel** (or **Home Carousel**) with schema URI set to `https://amplience.com/components/product-carousel` so the storefront can map it to the carousel component. Add the following fields:
   - **title** (string) — e.g. "Running shoes"
   - **productLineType** (enum: `search` | `category` | `skuList`)
   - **searchPhrase** (string) — used when productLineType is `search`
   - **category** (string) — used when productLineType is `category` (matches product `item_category`)
   - **skus** (array of strings) — used when productLineType is `skuList`

2. **Delivery key:** Create a content item of this type and set its **delivery key** to `home/carousel`. The home page fetches content by this key and passes the config to the carousel.

3. **Visualization URL:** In the content type’s **Visualizations** tab, set:
   ```
   {{NEXT_PUBLIC_APP_URL}}/visualization/{{hub.name}}/{{content.sys.id}}?vse={{vse.domain}}
   ```
   so authors can edit the carousel in Content Studio and see the storefront preview.

4. **Edit affordance:** When the storefront is opened with `?vse=` in the URL (e.g. `http://localhost:3000/?vse=your-hub.staging.bigcontent.io`), a **pencil icon** appears on the carousel. Clicking it opens an **edit dialog** where authors can change the title, product line type (search phrase, category, or product list), and for product list mode, **pick products from the catalog** via a searchable product picker. To enable saving changes to Amplience, set `AMPLIENCE_CLIENT_ID` and `AMPLIENCE_CLIENT_SECRET` in your environment (see `.env.example`).

## Storefront: PDP, home slot, and nav

- **Home page:** The home route (`/`) is driven by **AEM** only (no override). To add an optional Amplience slot (e.g. `home/slot/top`), render `<AmplienceWrapper fetch={{ key: "home/slot/top" }} />` in `app/page.jsx` where you want it; use delivery key `home/slot/top` in Amplience.
- **PDP content:** Product pages under `/product/:slug` use existing **Adobe Commerce** data and `ProductDetail`; they also fetch Amplience content by key `pdp/content/{SKU}` (slug uppercased). If the Product PDP content type returns `active: true` and a `content` array, each item is rendered with `AmplienceWrapper` (hero, banner, etc.) below the product detail. Use delivery key format `pdp/content/{SKU}` in Amplience.
- **Nav / slots:** To drive header or footer from Amplience, fetch by delivery key (e.g. `main-nav`, `footer-nav`) via `/api/amplience/content?key=main-nav` and render in your nav component. For hierarchy-based nav, extend `lib/amplience/client.js` with a hierarchy fetch (Filter API by parent id) or use slot content with a list structure.

## References

- [Amplience SFCC Composable Commerce](https://github.com/amplience/amplience-sfcc-composable-commerce) — source of patterns (visualization route, toolbar, config).
- [Amplience visualization docs](https://amplience.com/docs/integration/visualizations.html) — setting content type visualization URLs.
