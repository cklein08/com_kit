# com_kit

Next.js app combining **AEM headless**, **Adobe Commerce**, and **Amplience** (patterns from [amplience-sfcc-composable-commerce](https://github.com/amplience/amplience-sfcc-composable-commerce)) for a single storefront.

## Stack

- **Next.js** 16 (App Router)
- **React** 19
- **AEM Headless** (`@adobe/aem-headless-client-js`) — pages and blocks; **Adobe Universal Editor** for in-context editing
- **Adobe Commerce** (Commerce Optimizer GraphQL) — product and catalog data
- **Amplience** (`dc-delivery-sdk-js`, `dc-visualization-sdk`) — Content Studio visualization, toolbar (“site tools”), PDP content blocks, optional slots
- **Tailwind CSS**, **Radix UI**, **shadcn-style** components

## How content and commerce fit together

| Area | Source | Editor |
|------|--------|--------|
| **Home / slug pages** | AEM (screen by path) | Adobe Universal Editor |
| **Product data** | Adobe Commerce (GraphQL) | — |
| **Product page layout** | Existing product detail + **Amplience PDP content** (hero, banner, etc. by key `pdp/content/{SKU}`) | Amplience Content Studio (visualization URL) |
| **Nav / footer** | AEM-driven today; optional Amplience by key (`main-nav`, `footer-nav`) | — |

AEM and Amplience coexist: same layout (MainNav, Footer, AuthBar), same product routes; Amplience adds extra content on product pages and optional slots where you configure it.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and set:

   - **Commerce**: `NEXT_PUBLIC_COMMERCE_OPTIMIZER_URL`, `NEXT_PUBLIC_CATALOG_VIEW_ID`
   - **Auth (Sign in with Adobe, same as AEM author)**: `ADOBE_CLIENT_ID`, `ADOBE_CLIENT_SECRET`, `AUTH_SECRET` (or `ADOBE_SESSION_SECRET`). Optional: `ADOBE_IMS_ORG_ID` to scope sign-in to an org.
   - **Amplience (Content Studio)**: `NEXT_PUBLIC_AMPLIENCE_HUB`, `NEXT_PUBLIC_APP_URL` — see [docs/amplience-content-studio.md](docs/amplience-content-studio.md) for visualization and toolbar setup.
   - **Universal Editor (AEM)**: To open this app in Adobe Universal Editor when authors click Edit in AEM, configure the preview URL in AEM to point at this storefront. See [docs/universal-editor-aem-preview.md](docs/universal-editor-aem-preview.md). For local dev, use a tunnel (e.g. `npm run tunnel`) and the tunnel URL in UE—see [docs/universal-editor-tunnel.md](docs/universal-editor-tunnel.md).
   - Optional: content source (AEM, da.live) and related vars

3. **Run locally**

   ```bash
   npm run dev
   ```

   App runs at [http://localhost:3000](http://localhost:3000).

   Dev uses Webpack (`--webpack`) to avoid Turbopack panics. Use `npm run dev:turbo` for Turbopack.

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start dev server                      |
| `npm run build` | Production build                     |
| `npm run start` | Start production server              |
| `npm run lint`  | Run ESLint                           |

## Repo and branch

- **Remote:** https://github.com/cklein08/com_kit.git  
- **Starting branch:** `init`  

Push (from repo root, one level up from this folder):

```bash
git push -u origin init
```

## License

Private.
