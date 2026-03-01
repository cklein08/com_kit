# com_kit Cloudflare Worker

Authenticates users via Microsoft Entra ID (Azure AD) at the edge, then proxies to the Next.js app. Same pattern as [awesomeportal](https://github.com/Adobe/awesomeportal).

## Quick start

```bash
npm install
# Edit wrangler.toml: APP_ORIGIN, MICROSOFT_ENTRA_TENANT_ID, MICROSOFT_ENTRA_CLIENT_ID
wrangler secret put COOKIE_SECRET
npm run deploy
```

See [../docs/cloudflare-authentication.md](../docs/cloudflare-authentication.md) for full setup.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server (proxies to APP_ORIGIN) |
| `npm run deploy` | Deploy to Cloudflare |
| `npm run tail` | Tail production logs |
