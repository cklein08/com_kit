# Universal Editor: local dev with a tunnel (recommended)

Using **raw `http://localhost:3000`** as the Universal Editor preview URL often fails: AEM may reject it as an invalid origin and browser CORS can block UE. The recommended approach is to expose your local app via a **public HTTPS URL** (tunnel) and use that URL in UE and in AEM allowed origins.

---

## 1. Expose localhost via a tunnel

Run your app as usual (`npm run dev` → `http://localhost:3000`), then start a tunnel that forwards a public HTTPS URL to port 3000.

### Option A: ngrok

```bash
# From project root (or use the npm script with resource limits, see below)
ngrok http 3000
```

You’ll get a URL like `https://abc123.ngrok-free.app` (or a custom subdomain if configured). That URL forwards to `http://localhost:3000`.

**Install:** [ngrok.com](https://ngrok.com) or `brew install ngrok`.

### Option B: Cloudflare Tunnel (cloudflared)

```bash
cloudflared tunnel --url http://localhost:3000
```

**Install:** [developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation).

### Option C: Other tools

Any tool that gives you a public HTTPS URL → `http://localhost:3000` is fine (e.g. localtunnel, bore).

---

## 2. Universal Editor script (already in place)

This app already loads the Universal Editor CORS script and sets the AEM connection meta tag:

- **Script:** `https://universal-editor-service.adobe.io/cors.js` (see `lib/constants.ts` → `UE_CORS_SCRIPT_URL`).
- **Meta:** `urn:adobe:aue:system:aemconnection` in root layout and `UniversalEditorConnection`.
- **Editable areas:** `data-aue-resource`, `data-aue-type`, `data-aue-label` (and `-model` where applicable) on homepage, slug, PDP, and cart.

No change needed unless you switch to a different UE client (e.g. `experience.adobe.com/.../client.js`); then update `NEXT_PUBLIC_UE_CORS_SCRIPT_URL` in `.env`.

---

## 3. Configure allowed origins / CORS in AEM

AEM Author must allow your **tunnel domain** (not `localhost`) as an origin for UE:

- Add the tunnel host to **CORS allowed origins** (e.g. `https://abc123.ngrok-free.app`).
- Add it to **Allowed Universal Editor domains** / Sites configuration (exact name depends on your AEM version).
- Ensure any CDN or web tier in front of author doesn’t block requests from that origin.

If you use `http://localhost:3000` as origin, AEM typically won’t treat it as valid and CORS can block UE.

---

## 4. Use the tunnel URL in Universal Editor

- In **AEM**, set each page’s **preview URL** to the **tunnel URL** + path, for example:
  - Home: `https://abc123.ngrok-free.app/`
  - PDP: `https://abc123.ngrok-free.app/product/WKND-T-Shirt`
  - Cart: `https://abc123.ngrok-free.app/cart`
- Open the page in the **Universal Editor** (Edit from AEM). UE will load that tunnel URL; the tunnel forwards to your local app.

You can keep two setups:

- **Local dev:** Preview URL = tunnel URL (e.g. `https://my-app-dev.ngrok.io`) → forwards to `localhost:3000`.
- **Non-local:** Preview URL = staging/prod CDN (e.g. `https://your-app.com`).

---

## 5. Limiting tunnel resource use (threshold)

To avoid the tunnel using more of your machine than you want:

1. **Run only when testing UE**  
   Start the tunnel when you need to use Universal Editor; stop it when you’re done.

2. **Use the npm script (lower CPU priority on macOS/Linux)**  
   From the repo:

   ```bash
   npm run tunnel
   ```

   This runs the tunnel with **lower CPU priority** (`nice -n 15`) so it doesn’t compete with your dev server or IDE. On Windows, run `ngrok http 3000` directly (no `nice`). See `package.json` → `scripts.tunnel`.

3. **Don’t leave it running indefinitely**  
   Tunnel processes are usually light, but long-running tunnels can add up. Prefer starting and stopping per session.

4. **Optional: time limit**  
   If you use ngrok, you can run it in a one-off way and stop after a set time (e.g. “use for 30 minutes then Ctrl+C”). There is no built-in max-duration flag; stopping the process is the limit.

No code in this repo enforces a hard CPU/memory cap; the “threshold” is: run with `npm run tunnel` (nice), use only when needed, and stop when done.
