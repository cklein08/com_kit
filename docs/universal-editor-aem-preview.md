# Universal Editor: opening this app from AEM

This app is instrumented for **Adobe Universal Editor** (UE): it loads the UE CORS script, sets the AEM connection meta tag, and adds `data-aue-resource` (and related attributes) so **homepage, PDP, PLP, and cart** can all be opened and used in the Universal Editor. Configure the **preview URL** in AEM for each page type to point at this storefront.

## Page types and preview URLs

Set each AEM page’s preview URL to the storefront URL that serves that page:

| Page | Storefront path | Example preview URL (local) |
|------|-----------------|----------------------------|
| **Homepage** | `/` | `https://localhost:3000/` |
| **Product (PDP)** | `/product/{slug}` | `https://localhost:3000/product/WKND-T-Shirt` |
| **Product list (PLP)** | Any slug that renders an AEM screen with product list blocks (e.g. `/new-arrivals`) | `https://localhost:3000/new-arrivals` |
| **Cart** | `/cart` | `https://localhost:3000/cart` or `https://<tunnel-host>/cart` |

Use HTTPS for UE. **Recommended for local dev:** expose `http://localhost:3000` via a tunnel (e.g. `npm run tunnel` then use the tunnel URL such as `https://abc123.ngrok-free.app`) so AEM and UE can load your app without CORS issues. See [Universal Editor: local dev with a tunnel](universal-editor-tunnel.md).

## How it works

1. In **AEM Author**, each page (or experience fragment / screen) has a **preview URL** that tells the Universal Editor which URL to load when the author clicks **Edit**.
2. Set that preview URL to the matching storefront path in the table above.
3. When the author clicks Edit in AEM, the Universal Editor opens and loads that URL in an iframe. The app renders with UE instrumentation so UE can attach (and, for AEM-driven content, persist edits).

References: [Accessing and Navigating the Universal Editor](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/sites/authoring/universal-editor/navigation), [Universal Editor Architecture](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/architecture).

## Instrumentation by page

- **Homepage** (`/`): AEM screen by path; full `data-aue-resource` / `-type` / `-label` / `-model` on screen and each block.
- **Slug (AEM content)** (e.g. `/new-arrivals`): Same as homepage; screen and blocks instrumented for UE.
- **Product (PDP)** (`/product/:slug`): Page-level container with `data-aue-resource` / `-type` / `-label` so the page can be opened in UE (product data is Commerce + Amplience).
- **Cart** (`/cart`): Page-level container with `data-aue-resource` / `-type` / `-label` so the page can be opened in UE.

All of these pages load the UE CORS script; the connection meta tag is set in the root layout.

## Configuring the preview URL in AEM

Exact steps depend on your AEM setup (Sites vs headless screens). In general:

1. Log in to **AEM Author**.
2. Navigate to **Sites** (or your content tree) and select the page/screen that should open this storefront in UE.
3. Set the page’s **preview URL** (or equivalent) to the storefront URL for that path. Where this is configured varies by template and AEM version; your AEM admin or [AEM UE navigation docs](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/sites/authoring/universal-editor/navigation) can confirm.

For **local development**, prefer a **tunnel URL** (e.g. `https://my-app-dev.ngrok.io`) over localhost so AEM allowed origins and CORS work; see [universal-editor-tunnel.md](universal-editor-tunnel.md). Set `NEXT_PUBLIC_AEM_EDITOR_URL` in `.env` to your AEM author URL if needed (see `.env.example`).

## URL-to-AEM path mapping (magazine-style URLs)

Slug routes are resolved in `app/[...slug]/page.js`:

- **Full AEM path in URL:** If the URL path looks like `/content/dam/{project}/site/...`, it is used as the AEM content path.
- **Locale from URL:** If the slug starts with a known locale (e.g. `us`, `en`), the app treats those segments as locale and the rest as the content path. Example: `/us/en/magazine` → AEM path `/content/dam/{project}/site/us/en/magazine`. Supported locale prefixes are defined in `lib/constants.ts` (`URL_LOCALE_SEGMENTS`).
- **Otherwise:** Locale comes from localStorage (or default `en`), and the full slug is used: `/content/dam/{project}/site/{locale}/{slug}`.

Ensure AEM has a screen at the path your URL produces, and set the AEM page’s preview URL to the matching storefront URL (e.g. `https://your-app.com/new-arrivals` or `https://your-app.com/us/en/magazine` if you use locale-in-URL).

## When the app is opened in Universal Editor

- The app is loaded in an **iframe**. When run inside an iframe, the **config modal** (AEM environment / project name) is not shown so the UE experience is unblocked.
- If `aemEnvironment` and `projectName` are not in localStorage, the app uses **defaults** from env: `NEXT_PUBLIC_AEM_EDITOR_URL` and `NEXT_PUBLIC_AEM_PROJECT` (see `.env.example`). Set these so content loads when the app is opened from UE without a prior visit to set config.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_AEM_EDITOR_URL` | Default AEM author URL (connection meta and fallback when in UE iframe). |
| `NEXT_PUBLIC_AEM_PROJECT` | Default AEM project name when in UE iframe and not in localStorage. |
| `NEXT_PUBLIC_UE_CORS_SCRIPT_URL` | UE CORS script URL (default: Adobe’s cloud service). |

See `.env.example` for more.
