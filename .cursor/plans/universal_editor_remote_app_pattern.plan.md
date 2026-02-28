---
name: Universal Editor remote app pattern
overview: Align com_kit with the minimal "Remote App" pattern used by ue-remote-app.adobe.net (Adobe's sample editable app)—instrumentation only, no magazine/Edge Delivery flow.
todos: []
isProject: false
---

# Universal Editor: stick to the sample Remote App pattern

## Goal

Make com_kit behave like **https://ue-remote-app.adobe.net/** (Adobe’s sample Remote App): minimal instrumentation so the app can be opened and edited in the Universal Editor. No dependency on the WKND magazine / Edge Delivery flow.

Reference: [Universal Editor Sample Editable App](https://github.com/adobe/universal-editor-sample-editable-app), [UE Architecture – Remote App](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/architecture).

---

## What the sample Remote App requires

1. **UE CORS script** – Loaded so the Universal Editor can talk to the page.
2. **Connection meta tag** – `urn:adobe:aue:system:aemconnection` (or other connection) so UE knows where to persist edits.
3. **Instrumented DOM** – `data-aue-resource`, `data-aue-type`, `data-aue-label`, and optionally `data-aue-model`, `data-aue-prop`, `data-aue-filter` on editable containers and fields.

---

## What com_kit already has

| Requirement | Status | Where |
|-------------|--------|--------|
| UE CORS script | Done | [app/page.jsx](app/page.jsx), [app/[...slug]/page.js](app/[...slug]/page.js), [app/cart/page.jsx](app/cart/page.jsx) – `Script src={UE_CORS_SCRIPT_URL}` |
| Connection meta | Done | [app/layout.tsx](app/layout.tsx) (static), [components/universal-editor-connection.jsx](components/universal-editor-connection.jsx) (runtime AEM URL from localStorage / env) |
| Instrumented screen/blocks | Done | [app/page.jsx](app/page.jsx), [app/[...slug]/page.js](app/[...slug]/page.js) – screen container + each block get `data-aue-resource`, `-type`, `-label`, `-model` |
| Instrumented AEM components | Done | Hero, CategoryGrid, ProductListPage, ProductCollection, etc. – `data-aue-resource` and prop-level `data-aue-prop` / `-type` / `-label` |

So the **first one** (sample Remote App pattern) is already in place.

---

## Optional checks (no scope change)

- **Compare with sample app** – Skim [universal-editor-sample-editable-app](https://github.com/adobe/universal-editor-sample-editable-app) for any extra attributes or URN patterns and align if useful.
- **Opening in UE** – To actually open com_kit in the Universal Editor, AEM still needs a page whose preview URL points at your app (e.g. `https://localhost:3000` or your deployed URL). That’s an AEM configuration step, not a code change.

---

## Out of scope (by choice)

- Magazine-style URL mapping (`/us/en/magazine`) and Edge Delivery–style flow.
- Deeper AEM preview URL / site registration steps (can be added later if you want the full “click Edit in AEM and see com_kit” flow).

---

## Summary

Sticking to the **first one** means: com_kit is already aligned with the **ue-remote-app.adobe.net** style—minimal Remote App instrumentation (CORS script, connection meta, `data-aue-*` on screen and components). No code changes are required for this pattern; optional follow-ups are comparing with the sample app repo and configuring AEM preview URL when you want to open the app from AEM.
