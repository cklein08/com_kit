---
name: Carousel VSE catalog editing
overview: Add editing features for the product carousel when the page is opened with `?vse=` in the URL, allowing authors to select product lines from the Adobe Commerce catalog (search phrase, category filter, or curated SKU list), with configuration persisted in Amplience and an "Edit" affordance that opens Content Studio visualization.
todos: []
isProject: false
---

# Carousel editing from `?vse=` URL with catalog product-line selection

## Current state

- **vse**: When the URL has `?vse=...`, [AmplienceToolbarWhenVse](components/amplience/toolbar-when-vse.jsx) shows the Amplience toolbar (layout). No carousel-specific editing exists today.
- **Carousel**: [RunningShoesCarousel](components/running-shoes-carousel/running-shoes-carousel.jsx) is hardcoded on the home page (before CategoryGrid in [app/page.jsx](app/page.jsx)). It uses `searchProducts(CATALOG_VIEW_ID, ..., "running shoes", ...)` or falls back to `PLACEHOLDER_SHOES`; it has no props and no connection to Amplience.
- **Catalog**: Product data comes from Adobe Commerce via [lib/api/plp.ts](lib/api/plp.ts) (`searchProducts` with phrase; products can have `category` from `item_category`). There is no separate category list API; categories are derived client-side from search results (e.g. [ProductListPage](components/product-list-page/product-list-page.js) uses `getAllCategories(products)`).

## Goal

When `?vse=` is present, enable authors to:

1. **Edit** the carousel (open it in Amplience Content Studio / visualization).
2. **Choose the product line** for the carousel from the catalog: search phrase, category filter, or a list of SKUs.

Configuration should persist in Amplience so the home page renders the carousel from that content.

## Architecture

```mermaid
sequenceDiagram
  participant User
  participant HomePage
  participant AmplienceAPI
  participant Carousel
  participant CommerceAPI

  User->>HomePage: Visit /?vse=...
  HomePage->>AmplienceAPI: getContentByKey("home/carousel")
  AmplienceAPI-->>HomePage: carousel config or null
  HomePage->>Carousel: render with config + show "Edit" if vse
  Carousel->>CommerceAPI: searchProducts or getProductsBySkus per config
  CommerceAPI-->>Carousel: products
  Carousel->>User: carousel + Edit link
  User->>HomePage: Click "Edit" -> /visualization/hub/id?vse=...
  User->>Amplience: Edit in Content Studio; storefront preview updates
```



## Implementation plan

### 1. Carousel configuration model

Define a small config shape used by both Amplience content and the component:

- **title** (string) — e.g. "Running shoes"
- **productLineType** (`"search"` | `"category"` | `"skuList"`)
- **searchPhrase** (string) — for `search` (e.g. "running shoes")
- **category** (string) — for `category` (e.g. "running"); applied as client-side filter on `product.category` after search
- **skus** (string[]) — for `skuList`; fetch these SKUs from catalog

Amplience content type "Product Carousel" (or "Home Carousel") will have these fields and a delivery key `**home/carousel`**.

### 2. Fetch carousel content on the home page

In [app/page.jsx](app/page.jsx):

- When rendering the block that includes the carousel, also fetch Amplience content by key `home/carousel` (server or client via existing `/api/amplience/content?key=...`). Pass `vse` and `locale` from the URL so authors see draft content when in VSE.
- Pass the resolved carousel config (and if in vse mode, the content id and hub for the Edit link) into the carousel block.

### 3. Make RunningShoesCarousel config-driven

Refactor [components/running-shoes-carousel/running-shoes-carousel.jsx](components/running-shoes-carousel/running-shoes-carousel.jsx):

- Accept optional props: **config** (or explicit: title, productLineType, searchPhrase, category, skus). If no config, keep current default: title "Running shoes", search phrase "running shoes".
- **Product loading logic**:
  - `productLineType === "search"`: `searchProducts(..., config.searchPhrase, limit, 1)` (current behavior).
  - `productLineType === "category"`: `searchProducts(..., "" or broad phrase, larger limit, 1)` then filter by `product.category === config.category` (same pattern as ProductListPage).
  - `productLineType === "skuList"`: for each SKU in `config.skus`, fetch product (reuse or add `getProductBySku`); support a small helper or batch in [lib/api/plp.ts](lib/api/plp.ts) (e.g. `getProductsBySkus(skus)` that runs existing search/get in parallel).
- Render **title** from config; keep existing carousel UI (CarouselContent, CarouselItem, links, images, price).

### 4. "Edit" affordance when vse is present

When the page has `?vse=` and carousel content was loaded by key:

- Wrap the carousel in a small **carousel editor chrome** (e.g. a wrapper div with `data-amplience` or a class) that shows an **"Edit carousel"** control (button or link).
- The control links to the Amplience visualization URL for that content:  
`{{APP_URL}}/visualization/{{hub}}/{{contentId}}?vse={{vse}}`  
so opening it loads the carousel content in Content Studio’s iframe. Hub and contentId come from the carousel content item (e.g. `content.sys.id` or `_meta.deliveryId`; hub from URL param or config).
- If no carousel content exists yet (key `home/carousel` returns null), the control can point to Amplience with instructions to create content with key `home/carousel`, or show a short message: "Create 'Home Carousel' in Amplience with key home/carousel."

### 5. Amplience content type and visualization

- **Document** in [docs/amplience-content-studio.md](docs/amplience-content-studio.md) (or a short carousel doc): create a content type "Product Carousel" with the fields above; set delivery key to `home/carousel` for the home carousel instance; set visualization URL to  
`{{NEXT_PUBLIC_APP_URL}}/visualization/{{hub.name}}/{{content.sys.id}}?vse={{vse.domain}}`  
so authors can edit the carousel and see the storefront preview.
- No change to the generic visualization route [app/visualization/[hubName]/[contentId]/page.jsx](app/visualization/[hubName]/[contentId]/page.jsx); it already renders any content via AmplienceWrapper. Register the **Product Carousel** schema in [AmplienceWrapper](components/amplience/wrapper/index.jsx) so that when the visualization page loads a carousel content item, it can render a preview (e.g. the same ProductCarousel component with the content’s config, or a minimal preview). That way editing in Content Studio shows the carousel behavior in the iframe.

### 6. Optional: Category picker in Amplience

- Today there is no API that returns a list of "product line" categories. Categories are the distinct `product.category` (item_category) values from search. For the Amplience form, authors can type the **category** string (e.g. "running") until we add a dynamic list.
- Optional follow-up: add a storefront API (e.g. `/api/catalog/categories`) that runs a broad search and returns unique `item_category` values, and optionally a small Amplience custom UI or dropdown that calls it for a friendlier picker.

## Files to touch


| Area      | File                                                                                                                         | Changes                                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home page | [app/page.jsx](app/page.jsx)                                                                                                 | Fetch `home/carousel` by key (with vse/locale); pass config + contentId/hub to carousel; when vse, render carousel inside edit chrome with "Edit" link to visualization URL. |
| Carousel  | [components/running-shoes-carousel/running-shoes-carousel.jsx](components/running-shoes-carousel/running-shoes-carousel.jsx) | Accept config prop; implement search / category / skuList product loading; use config.title.                                                                                 |
| API       | [lib/api/plp.ts](lib/api/plp.ts)                                                                                             | Add `getProductsBySkus(skus, ...)` (parallel getProductBySku or batch) for skuList mode.                                                                                     |
| Amplience | [components/amplience/wrapper/index.jsx](components/amplience/wrapper/index.jsx)                                             | Map Product Carousel schema to a component that renders the same carousel UI from content (for visualization page).                                                          |
| Docs      | [docs/amplience-content-studio.md](docs/amplience-content-studio.md)                                                         | Document Product Carousel content type, delivery key `home/carousel`, and visualization URL.                                                                                 |


## Clarifications

- **Product line**: Interpreted as “what set of products the carousel shows”—driven by search phrase, category (item_category), or explicit SKU list. If your business uses a different “product line” concept (e.g. a specific catalog view or API), that can be added as another `productLineType` and wired to the same carousel component.
- **Persistence**: Amplience content with key `home/carousel` is the source of truth when present; otherwise the carousel falls back to current default ("running shoes" search). No localStorage or URL params for config.

## Summary

- From `/?vse=...`, the home page fetches Amplience content at `home/carousel` and passes it to the carousel.
- The carousel becomes config-driven (title + productLineType: search | category | skuList) and loads products from the existing catalog (searchProducts / category filter / getProductsBySkus).
- When vse is on, an "Edit carousel" link sends authors to the visualization URL for that content so they can select product lines in Content Studio and see the storefront preview update.

