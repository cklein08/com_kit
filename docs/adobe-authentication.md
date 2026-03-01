# Signing into Adobe's systems for authentication

This app uses **the same type of auth as AEM Cloud Service author** (e.g. [author-*.adobeaemcloud.com](https://author-p124903-e1367755.adobeaemcloud.com)): **Sign in with Adobe** via **Adobe IMS** (OAuth 2.0 / OpenID Connect).

## How it works

1. User clicks **Sign in** → app redirects to `https://ims-na1.adobelogin.com/ims/authorize/v2` with `client_id`, `redirect_uri`, scopes (`openid`, `email`, `profile`, `offline_access`), and `state`.
2. User signs in at Adobe (same experience as AEM author).
3. IMS redirects back to `/api/auth/adobe/callback` with an authorization code.
4. Backend exchanges the code for access and refresh tokens, calls the IMS UserInfo endpoint, creates a signed session cookie, and redirects to `/`.

**Required env:** `ADOBE_CLIENT_ID`, `ADOBE_CLIENT_SECRET`, `AUTH_SECRET` (or `ADOBE_SESSION_SECRET`).  
**Optional:** `ADOBE_IMS_ORG_ID` to scope sign-in to an organization.  
**Redirect URI** to register in Adobe Developer Console: `https://your-domain/api/auth/adobe/callback` (and for local dev, e.g. `http://localhost:3000/api/auth/adobe/callback` if allowed).

Use an **OAuth Web App** credential in [Adobe Developer Console](https://developer.adobe.com/console/) and add the callback URL to Redirect URI patterns.

## Other options (reference)

Below are alternative ways to integrate Adobe identity if you need something different.

## 2. Federated ID / SSO (SAML)

For **enterprise/organization** users, Adobe supports **Federated ID**: users sign in with your organization’s identity provider (IdP) via SAML. Adobe does not send OAuth tokens to your app in this flow; the IdP does.

To have your app know the user:

- Your app can act as a **Service Provider (SP)** in a SAML flow: user hits your app → redirect to IdP → IdP authenticates → IdP posts a SAML response to your app → your app creates a session from the assertion.
- Alternatively, if users always reach your app *after* signing into Adobe (e.g. from an Adobe-hosted or AEM entry point), they may already have an Adobe session; then you need a way to get identity (e.g. Adobe context, headers, or a separate API) into your app.

Resources:

- [Set up identity and Single Sign-On (Adobe Enterprise)](https://helpx.adobe.com/enterprise/using/set-up-identity.html)
- [Federated ID (SSO) sign-in](https://helpx.adobe.com/enterprise/kb/tshoot-fed-id.html)

## 3. AEM / Experience Cloud context

If this app is **hosted in or behind** Adobe Experience Manager or Experience Cloud:

- The user may already be authenticated in Adobe’s context.
- Identity might be provided via request headers, server-side context, or an Adobe API that your backend can call with the incoming request context.

Implementation depends on your deployment (AEM, Edge, etc.) and how Adobe injects identity in that environment.

## Current behavior in this app

The app supports multiple auth methods (like [awesomeportal](https://github.com/Adobe/awesomeportal)):

### Adobe IMS implicit flow (client-side)

When `NEXT_PUBLIC_ADOBE_CLIENT_ID` is set:

- **Sign in**: Redirects to IMS with `response_type=token` (implicit flow). Token returned in URL hash.
- **Token storage**: `localStorage.accessToken` (value: `Bearer <token>`) and `localStorage.tokenExpiresAt`.
- **Silent refresh**: Hidden iframe with `prompt=none` ~5 minutes before expiry.
- **Profile**: Fetched from `/api/auth/ims/profile` (proxy to IMS userinfo).
- **Sign out**: Clears localStorage and redirects to `/`.

**Required env:** `NEXT_PUBLIC_ADOBE_CLIENT_ID` (no client secret).  
**Redirect URI** in Adobe Console: `https://your-domain/*` or `https://localhost:3000/*` (pattern for implicit flow).

### Adobe IMS auth code flow (server-side)

When `ADOBE_CLIENT_ID` and `ADOBE_CLIENT_SECRET` are set (and implicit not preferred):

- **Sign in**: Redirects to IMS, callback at `/api/auth/adobe/callback` exchanges code for tokens.
- **Session**: HTTP-only signed cookie (`lib/auth/session.js`).
- **Sign out**: POST or GET `/api/auth/signout` clears the session cookie.

### Cookie auth (fallback)

When running on `*.workers.dev` or `http://localhost:8787`, the user is considered authenticated without a token (session handled by the host).

### Microsoft Entra / Cloudflare

See [microsoft-entra-authentication.md](microsoft-entra-authentication.md) and [cloudflare-authentication.md](cloudflare-authentication.md).
