# Microsoft Entra ID (Azure AD) Authentication

This app supports **Microsoft Entra ID** (Azure AD) authentication, adapted from the [awesomeportal](https://github.com/Adobe/awesomeportal) project. When configured, it is the preferred sign-in method over Adobe IMS.

## How it works

1. User clicks **Sign in** → app redirects to Microsoft Entra authorize endpoint with `response_type=id_token`, `response_mode=form_post`, and `scope=openid profile`.
2. User signs in at Microsoft.
3. Microsoft POSTs back to `/api/auth/entra/callback` with `id_token` and `state`.
4. Backend validates the id_token with JWKS, creates a session JWT, sets a `Session` cookie, and redirects to the original URL or `/`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MICROSOFT_ENTRA_TENANT_ID` | Yes | Your Azure AD tenant ID |
| `MICROSOFT_ENTRA_CLIENT_ID` | Yes | App registration client ID |
| `MICROSOFT_ENTRA_JWKS_URL` | Yes | JWKS URL for id_token validation (e.g. `https://login.microsoftonline.com/common/discovery/keys`) |
| `AUTH_SECRET` | Yes | Secret for signing session and state cookies (shared with Adobe auth) |
| `SESSION_COOKIE_EXPIRATION` | No | Session lifetime (default `6h`) |
| `LOGIN_PAGE` | No | Path to redirect after login (default `/`) |
| `REQUIRE_AUTHENTICATION` | No | Set to `true` to protect all routes except public paths |
| `DISABLE_AUTHENTICATION` | No | Set to `true` to skip auth (dev only) |

## Azure App Registration

1. In [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**.
2. Set **Redirect URI** to **Web** and add:
   - `https://your-domain/api/auth/entra/callback`
   - `http://localhost:3000/api/auth/entra/callback` (for local dev)
3. Under **Authentication**, enable **ID tokens** for implicit/hybrid flows.
4. Copy **Application (client) ID** and **Directory (tenant) ID** to your env.

## Route protection

When `REQUIRE_AUTHENTICATION=true` and Microsoft Entra is configured, the Next.js middleware protects all routes except:

- `/api/auth/*`
- `/_next/*`
- `/favicon.ico`, `/robots.txt`, `/filter-definition.json`
- `/public/*`, `/icons/*`, `/fonts/*`

Unauthenticated users are redirected to `/api/auth/entra/login` with the original URL preserved for post-login redirect.

**Note:** Route protection requires Microsoft Entra. Adobe IMS session verification uses Node.js crypto and cannot run in Edge middleware.

## Dual auth (Entra + Adobe)

- If both are configured, **Microsoft Entra is preferred** for sign-in.
- Session endpoint (`/api/auth/session`) checks Entra first, then Adobe.
- Sign-out uses the appropriate flow based on `authProvider` (entra → redirect to MS logout; adobe → clear cookie).

## API routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/entra/login` | GET | Start Microsoft Entra login (redirect) |
| `/api/auth/entra/callback` | POST | OIDC callback (form_post from Microsoft) |
| `/api/auth/entra/logout` | GET | Logout and redirect to Microsoft logout |
| `/api/auth/entra/user` | GET | Current user (requires auth) |
