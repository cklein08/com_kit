---
name: Universal Editor magazine-style flow
overview: Clarify how the AEM WKND magazine page (Edge Delivery) enables the Universal Editor, then align your com_kit app so authors can open it in Adobe Universal Editor the same way—including a magazine-style URL and AEM preview configuration.
todos: []
isProject: false
---

# Universal Editor: WKND magazine pattern and com_kit alignment

## How the WKND magazine page enables the Universal Editor

The page [https://main--wknd-xwalk--adobe-rnd.aem.page/us/en/magazine](https://main--wknd-xwalk--adobe-rnd.aem.page/us/en/magazine) is an **AEM Edge Delivery Services** site (different stack from your app):

- **Architecture:** Content and structure live in AEM; the site is built with Edge Delivery (block-based, Franklin-style). The `*.aem.page` domain is the **preview/published** URL for that site.
- **Opening in Universal Editor:** Authors go to **AEM Author → Sites**, select the site (e.g. “WKND (Universal Editor)”), open the page (e.g. magazine), and click **Edit**. AEM then opens the **Universal Editor** with the **preview URL** of that page (the `aem.page` URL). The UE loads that URL in an iframe and attaches to the page using instrumentation on the page (meta tag + block-level `data-aue-`* attributes).
- **Instrumentation:** The page is built so that each editable block/element has the correct `data-aue-resource`, `data-aue-type`, `data-aue-label`, etc. The connection to AEM is established via the meta tag `urn:adobe:aue:system:aemconnection` and the Universal Editor CORS script.

References: [Edge Delivery Services and Universal Editor (overview)](https://experienceleague.adobe.com/en/docs/experience-manager-learn/sites/edge-delivery-services/developing/universal-editor/0-overview), [Accessing and Navigating the Universal Editor](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/sites/authoring/universal-editor/navigation).

Your app uses **AEM Headless** (GraphQL `screenByPath`), not Edge Delivery, but the **same idea** applies: the app must be the “preview URL” that UE loads when an author clicks Edit on an AEM page, and the app must be instrumented so UE can attach.

---

## What your app already has (UE-ready)


| Piece                        | Where                                                                                                                                         | Purpose                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Connection meta              | [app/layout.tsx](app/layout.tsx) + [components/universal-editor-connection.jsx](components/universal-editor-connection.jsx)                   | `urn:adobe:aue:system:aemconnection` → AEM author URL (localStorage or `NEXT_PUBLIC_AEM_EDITOR_URL`)        |
| UE CORS script               | [app/page.jsx](app/page.jsx), [app/[...slug]/page.js](app/[...slug]/page.js), [app/cart/page.jsx](app/cart/page.jsx)                          | `Script src={UE_CORS_SCRIPT_URL}` so UE can communicate with the page                                       |
| Screen/block instrumentation | [app/page.jsx](app/page.jsx), [app/[...slug]/page.js](app/[...slug]/page.js), [ModelManager](components/model-manager.jsx) and AEM components | `data-aue-resource`, `data-aue-type`, `data-aue-label`, `data-aue-model` on screen container and each block |


So the **rendering and instrumentation** side is already in place for any route that returns AEM screen content (home and `[...slug]`). The missing link is **how authors open this app in the Universal Editor** (i.e. how AEM knows to open your storefront URL when they click Edit).

---

## How to “work in Universal Editor” with your app (magazine-style)

Conceptually, you want the same flow as the WKND magazine: author selects a page in AEM and clicks Edit → UE opens with **your app’s URL** for that page.

### 1. Register your app as the preview URL in AEM

- In **AEM Author**, each page (or experience fragment / screen that represents a “page”) has a **preview URL** (or similar) that tells the Universal Editor which URL to load when the author clicks **Edit**.
- That URL must point to **your storefront** for the corresponding path, e.g.:
  - Home: `https://your-app.com/` or `https://localhost:3000/` (with HTTPS for UE).
  - Magazine (or any slug): `https://your-app.com/us/en/magazine` or `https://your-app.com/magazine` (depending on how you map URLs; see below).
- **Action:** In AEM, configure the preview URL for the relevant pages (e.g. home, magazine) to these storefront URLs. Exact steps depend on your AEM setup (Sites vs headless screens); your AEM admin or [AEM UE navigation docs](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/sites/authoring/universal-editor/navigation) can confirm where to set this.
- For **local dev**, use `https://localhost:3000` (e.g. `npm run dev:https`) and set `NEXT_PUBLIC_AEM_EDITOR_URL` to your local AEM author URL if needed (see [.env.example](.env.example)).

### 2. Map a magazine-style URL to an AEM screen

Today, slug routes are resolved in [app/[...slug]/page.js](app/[...slug]/page.js):

- Slug segments → AEM path: `/content/dam/${project}/site/${locale}/${slugSegments.join('/')}`.
- Example: URL `/us/en/magazine` → slug `['us','en','magazine']` → path `/content/dam/v0/site/en/us/en/magazine` (assuming `storedLocale === 'en'`).
- If your AEM “magazine” screen is instead under a path like `/content/dam/v0/site/us/en/magazine` (locale `us/en`), then the **first two segments** should be treated as locale. Right now locale comes from **localStorage** only, not from the URL.

**Options:**

- **A) No code change:** Create in AEM a screen at the path that your current mapping produces (e.g. `.../site/en/us/en/magazine` or `.../site/en/magazine`) and set the AEM page preview URL to `https://your-app.com/us/en/magazine` or `https://your-app.com/magazine`.
- **B) Optional URL–locale mapping:** If you want `/us/en/magazine` to map to `.../site/us/en/magazine`, extend the path-building logic in `app/[...slug]/page.js` to treat the first one or two segments as locale when they match a known pattern (e.g. `us`, `en`) and pass the rest as the content path. Then create the magazine screen in AEM under that path and set the preview URL to `https://your-app.com/us/en/magazine`.

Once the preview URL is set in AEM and the path exists, opening that page in the Universal Editor will load your app at that URL; your existing `data-aue-`* on the screen and blocks will let UE attach.

### 3. Keep “edit mode” and pop-up behavior (Amplience vs UE)

You mentioned keeping the **pop-up displayed** in edit mode (themes are done with that). Clarification:

- **When opened from Amplience Content Studio** (URL has `?vse=...`): The **Amplience toolbar** is the “editor” UI; it should remain visible (your existing `AmplienceToolbarWhenVse` and theme picker). No change needed for UE.
- **When opened from AEM Universal Editor:** The “editor” UI is the **UE chrome** (sidebar/overlay). There is no separate “pop-up” from your app; the page is just the preview. Your app only needs to keep rendering the UE CORS script and the connection meta (and optionally not show the **config modal** when the app is clearly in UE, if you want a cleaner experience—e.g. detect UE and skip modal when AEM env/project can be inferred).

So “see how this page allows us to work in the universal editor” is achieved by: (1) AEM configured to open your app’s URL in UE when Edit is clicked, (2) your app already instrumented for UE on that URL, (3) optional: ensure `/us/en/magazine` (or `/magazine`) resolves to the right AEM screen and, if needed, add locale-from-URL mapping.

---

## Summary


| Goal                                     | Action                                                                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Understand how WKND magazine enables UE  | It’s an Edge Delivery site; authors click Edit in AEM Sites; UE loads the page’s preview URL (`aem.page`); page is instrumented with meta + `data-aue-`*.                                                           |
| Enable the same “work in UE” for com_kit | Set each AEM page’s preview URL to your storefront (e.g. `https://your-app.com/`, `https://your-app.com/us/en/magazine`). Your app already has connection meta, UE CORS script, and `data-aue-`* on screens/blocks. |
| Magazine-style URL                       | Use existing `[...slug]` route; ensure AEM has a screen at the path your slug produces, or add optional locale-from-URL so `/us/en/magazine` maps to the correct AEM path.                                          |
| Pop-up / edit mode                       | Amplience toolbar stays when `?vse=` is present (themes, etc.). In UE, the editor is the UE UI; no extra pop-up required. Optionally hide the AEM config modal when opened in UE.                                   |


No code changes are strictly required for UE to work once AEM preview URLs point to your app; optional work is (1) URL–locale mapping for `/us/en/...` and (2) skipping the config modal when in UE if desired.