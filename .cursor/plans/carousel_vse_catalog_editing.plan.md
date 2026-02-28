# Carousel editing from `?vse=` URL with catalog product-line selection

## Overview

Add editing features for the product carousel when the page is opened with `?vse=` in the URL: show a **pencil icon** on the carousel to indicate it is editable, and allow authors to select product lines from the catalog (search phrase, category, or SKU list), with configuration persisted in Amplience.

## Edit affordance: pencil icon when `?vse=` is present

When the URL contains `?vse=`:

- Show a **pencil icon** on or next to the carousel (e.g. top-right of the carousel section) so authors can see at a glance that the carousel is editable.
- The pencil should be the control that opens the Amplience visualization (Content Studio) for the carousel content—either as a link or a button that navigates to  
  `{{APP_URL}}/visualization/{{hub}}/{{contentId}}?vse={{vse}}`.
- Use a small, non-intrusive icon (e.g. from `lucide-react` or existing icon set: `Pencil` or `PencilIcon`) with appropriate aria-label (e.g. "Edit carousel") for accessibility.
- Style it so it’s visible in VSE mode but doesn’t dominate the carousel (e.g. absolute position, subtle background, or outlined icon).

Implementation detail: the home page (or a thin wrapper around the carousel) checks for `vse` in `searchParams`; when present and carousel content is loaded, render the carousel inside a wrapper that includes the pencil icon linking to the visualization URL.

## Rest of implementation (unchanged)

- **Config model**: title, productLineType (`search` | `category` | `skuList`), searchPhrase, category, skus. Stored in Amplience content with delivery key `home/carousel`.
- **Home page**: Fetch `home/carousel` by key (with vse/locale); pass config and contentId/hub into carousel block; when vse, render carousel + pencil-edit link.
- **RunningShoesCarousel**: Accept config prop; support search / category / skuList; use config.title; fallback to current default when no config.
- **API**: Add `getProductsBySkus` in `lib/api/plp.ts` for skuList mode.
- **AmplienceWrapper**: Map Product Carousel schema to carousel preview for visualization page.
- **Docs**: Document Product Carousel content type, key `home/carousel`, and visualization URL.

## Files to touch

- **[app/page.jsx](app/page.jsx)** — Fetch carousel content; when vse, wrap carousel in a chrome that shows the **pencil icon** linking to visualization URL.
- **[components/running-shoes-carousel/running-shoes-carousel.jsx](components/running-shoes-carousel/running-shoes-carousel.jsx)** — Config-driven props; optional wrapper or slot for an “edit icon” passed from parent when vse (or parent handles pencil in page.jsx).
- **[lib/api/plp.ts](lib/api/plp.ts)** — `getProductsBySkus`.
- **[components/amplience/wrapper/index.jsx](components/amplience/wrapper/index.jsx)** — Product Carousel schema → carousel component.
- **[docs/amplience-content-studio.md](docs/amplience-content-studio.md)** — Carousel content type and visualization.

## Summary

When `?vse=` is in the URL, the carousel is shown with a **pencil icon** that indicates editability and links to the Amplience Content Studio visualization for the carousel content. All other behavior (config-driven product lines, Amplience persistence, visualization URL) remains as in the original plan.
