# Cloudflare Worker Authentication for AEM

This project includes a **Cloudflare Worker** (like [awesomeportal](https://github.com/Adobe/awesomeportal)) that authenticates users via **Microsoft Entra ID** (Azure AD) at the edge before proxying to the Next.js app. Use this when you need to protect the storefront for AEM authors or enterprise users.

## Architecture

```
User → Cloudflare Worker (auth) → Next.js app (com_kit)
         ↓
    Microsoft Entra ID (login)
```

1. User visits the worker URL (e.g. `https://comkit.<account>.workers.dev`)
2. Worker checks for a valid `Session` cookie
3. If not authenticated → redirect to `/auth/login` → Microsoft Entra
4. After login → callback sets `Session` cookie → proxy to Next.js app
5. All subsequent requests include the cookie and are proxied through

## Setup

### 1. Deploy the Next.js app

Deploy com_kit to Vercel, a custom server, or any host. Note the URL (e.g. `https://comkit.vercel.app`).

### 2. Configure the Cloudflare Worker

```bash
cd cloudflare
npm install
```

Edit `wrangler.toml`:

```toml
[vars]
APP_ORIGIN = "https://your-nextjs-app.vercel.app"  # Your deployed Next.js URL
MICROSOFT_ENTRA_TENANT_ID = "your-tenant-id"
MICROSOFT_ENTRA_CLIENT_ID = "your-client-id"
MICROSOFT_ENTRA_JWKS_URL = "https://login.microsoftonline.com/common/discovery/keys"
```

### 3. Set the cookie secret

```bash
wrangler secret put COOKIE_SECRET
# Enter a cryptographically secure value, e.g. from: openssl rand -base64 32
```

### 4. Register the app in Microsoft Entra

1. [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**
2. Add **Redirect URI** (Web): `https://<your-worker>.<account>.workers.dev/auth/callback`
3. Under **Authentication**, enable **ID tokens**
4. Copy **Application (client) ID** and **Directory (tenant) ID** into `wrangler.toml`

### 5. Configure the Next.js app for Cloudflare

When the storefront is behind the worker, set these env vars on the Next.js deployment:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | Worker URL (e.g. `https://comkit.xxx.workers.dev`) – users visit this |
| `CLOUDFLARE_AUTH` | `true` |
| `AUTH_SECRET` | Same value as `COOKIE_SECRET` (for session validation) |
| `MICROSOFT_ENTRA_CLIENT_ID` | Same as worker (needed for JWT audience validation) |

### 6. Deploy the worker

```bash
npm run deploy
```

Users visit the worker URL. The worker authenticates them and proxies to the Next.js app.

## Local development

**Option A – Worker only**

```bash
cd cloudflare
# Set APP_ORIGIN = "http://localhost:3000" in wrangler.toml
# Run Next.js in another terminal: npm run dev
npm run dev
```

Visit `http://localhost:8787` (or the URL wrangler prints). The worker will proxy to localhost:3000.

**Option B – Next.js only**

Run the Next.js app normally. Use Microsoft Entra via the Next.js API routes (`/api/auth/entra/*`) or Adobe IMS. No worker needed.

## Disable authentication

For development, set in `wrangler.toml`:

```toml
[vars]
DISABLE_AUTHENTICATION = "true"
```

## Paths

| Path | Auth | Handler |
|------|------|---------|
| `/auth/*` | No | Worker (login, callback, logout, user) |
| `/*` | Yes | Proxied to Next.js app |

## Secrets

| Secret | Description |
|--------|-------------|
| `COOKIE_SECRET` | Signs session and state cookies. Must match `AUTH_SECRET` on the Next.js app when behind Cloudflare. |
