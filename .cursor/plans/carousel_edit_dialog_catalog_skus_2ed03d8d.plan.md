---
name: Carousel edit dialog catalog SKUs
overview: "Extend the carousel edit dialog plan so that SKUs are sourced from the catalog: the form uses a product picker (search/select) backed by the Adobe Commerce catalog instead of free-text SKU input."
todos: []
isProject: false
---

# Carousel edit dialog — SKUs from catalog

## Goal

In the carousel edit dialog (pencil opens form for title, product line type, search phrase, category, SKUs), **SKUs should come from the catalog**: authors pick products from the Adobe Commerce catalog via a searchable product picker instead of typing SKU strings.

## Current / planned state

- Carousel config has `skus: string[]` for `productLineType === "skuList"`.
- The catalog is exposed via [lib/api/plp.ts](lib/api/plp.ts): `searchProducts(viewId, locale, priceBookId, searchTerm, pageSize, currentPage)` returns products with `sku`, `name`, and other fields from Adobe Commerce (ACO).
- The carousel edit form was planned to have a simple textarea for comma-separated SKUs. This plan replaces that with a **catalog-backed product picker**.

## Approach: catalog product picker for SKUs

1. **Expose catalog search to the client** — The edit form runs in the browser. `searchProducts` in `lib/api/plp.ts` calls ACO_URL (Commerce GraphQL). Add a **server API route** that the form can call so credentials and CORS stay server-side, e.g.:
  - **GET /api/catalog/products?search=...&pageSize=...&page=...**
  - Handler calls `searchProducts(CATALOG_VIEW_ID, DEFAULT_LOCALE, DEFAULT_PRICE_BOOK, search, pageSize, page)` and returns a JSON array of `{ sku, name }` (and optionally `image` or `price` for display). This keeps ACO usage in the server and gives the form a simple contract.
2. **Product picker in the carousel edit form** — When **product line type** is **skuList**:
  - Replace the free-text SKU textarea with a **product picker** UI:
    - A **search input** that triggers requests to `/api/catalog/products?search=<query>&pageSize=10` (debounced).
    - A **dropdown or list** of matching products (show at least `name` and `sku`). User can click to **add** a product to the selected list.
    - A **list of selected products** (each with name, SKU, and a remove control). The order of this list is the order of `skus` sent on save.
  - On Save, send `skus` as the array of SKUs from the selected products (in order).
3. **Initial value when editing** — When opening the dialog with existing content that has `skus: string[]`, the form should show those as selected. If the catalog API supports fetching by SKU (e.g. existing `getProductBySku` or a batch by SKUs), optionally pre-fill the selected list with names; otherwise show the SKU strings and allow the user to search/add more or remove.

## Implementation details

### New API route: catalog products for picker

- **File:** [app/api/catalog/products/route.js](app/api/catalog/products/route.js) (or `.ts`).
- **Method:** GET.
- **Query params:** `search` (string, optional), `pageSize` (number, default 10 or 20), `page` (number, default 1). Optional: `skus` (comma-separated) to fetch specific SKUs for display (e.g. when loading existing selection).
- **Behavior:** Call `searchProducts` from `@/lib/api/plp` with `CATALOG_VIEW_ID`, `DEFAULT_LOCALE`, `DEFAULT_PRICE_BOOK`, and the query params. Return JSON: `{ products: [{ sku, name }] }` (and optionally `totalCount` for pagination). If `skus` is provided, you can call `getProductsBySkus` and return those for display.
- **Security:** Same as existing PLP usage (server-side only; no new secrets if ACO is already used server-side elsewhere).

### Carousel edit form: product picker UI

- In [components/running-shoes-carousel/carousel-edit-form.jsx](components/running-shoes-carousel/carousel-edit-form.jsx) (from the carousel edit dialog plan):
  - When `productLineType === "skuList"`:
    - **Selected list:** State `selectedProducts: { sku, name }[]` (or just `selectedSkus: string[]` and optionally a map for names). Initialize from `initialConfig.skus` — either fetch names via `/api/catalog/products?skus=...` on mount or show SKUs only until names load.
    - **Search:** Input + debounced fetch to `/api/catalog/products?search=...&pageSize=10`. Display results in a dropdown/list; on click, add that product to `selectedProducts` (and avoid duplicates by SKU).
    - **Remove:** Each selected item has a remove button; remove from state.
  - On Submit, set `skus: selectedProducts.map(p => p.sku)` (or from `selectedSkus` in order).

### Reuse existing UI

- Use existing [Input](components/ui/input), [Button](components/ui/button), and [Select](components/ui/select) where appropriate. For a combobox-style search + list, you can use a combination of Input and a popover/dropdown (e.g. [Popover](components/ui/popover) or a simple conditional list). If the project has [Command](components/ui/command) (e.g. CommandDialog), that can be used for a searchable list.

## Files to add or touch


| File                                                                                                                 | Action                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [app/api/catalog/products/route.js](app/api/catalog/products/route.js)                                               | **New.** GET handler: query params `search`, `pageSize`, `page`; optional `skus`; call `searchProducts` (and optionally `getProductsBySkus`); return `{ products: [{ sku, name }] }`.                                                                                            |
| [components/running-shoes-carousel/carousel-edit-form.jsx](components/running-shoes-carousel/carousel-edit-form.jsx) | Implement product picker when productLineType is skuList: search input, debounced fetch to `/api/catalog/products`, selectable results list, selected list with remove; submit `skus` array from selected. Pre-fill selection from `initialConfig.skus` (fetch names if needed). |


## Summary

- Add **GET /api/catalog/products** that returns catalog products (sku, name) from Adobe Commerce via existing `searchProducts` (and optionally `getProductsBySkus` for pre-fill).
- In the **carousel edit form**, for **skuList** mode, replace free-text SKUs with a **catalog-backed product picker**: search → pick from results → maintain ordered selected list → save as `skus` array. Existing carousel content with `skus` is pre-loaded into the selected list (with names from catalog when available).

