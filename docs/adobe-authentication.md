# Signing into Adobe's systems for authentication

This app does **not** use OAuth. The “Sign in” action sends users to **Adobe’s identity system** ([id.adobe.com](https://id.adobe.com)) so they can sign in there. The app does not receive tokens or user identity from that redirect.

To have the app know who is signed in, you need to add one of the following.

## 1. Adobe IMS (OpenID Connect / OAuth 2.0)

For a web app, the standard way to get user identity from Adobe is **Adobe IMS** with the 3-legged OAuth flow (or OpenID Connect):

- User is sent to `https://ims-na1.adobelogin.com/ims/authorize/v2` with your `client_id`, `redirect_uri`, and scopes.
- After sign-in and consent, Adobe redirects back to your app with an authorization code.
- Your backend exchanges the code for access and refresh tokens and optionally calls the IMS UserInfo endpoint.
- You then create a session (e.g. signed cookie) with the user’s identity.

Resources:

- [User authentication (Adobe Developer)](https://developer.adobe.com/developer-console/docs/guides/authentication/UserAuthentication/)
- [Authorize request (IMS API)](https://developer.adobe.com/developer-console/docs/guides/authentication/UserAuthentication/ims#authorize-request)
- Optional: use an OAuth library (e.g. Passport.js) or the [@adobe/aio-lib-ims](https://www.npmjs.com/package/@adobe/aio-lib-ims) SDK.

You’ll need an **OAuth Web App** (or Single Page App) credential in the Adobe Developer Console and to implement the authorize and token-exchange routes plus session handling.

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

- **Sign in**: Redirects to [id.adobe.com](https://id.adobe.com) (with an optional `redirect_uri` back to the app). No tokens or user data are received.
- **Session**: The app still has a session cookie abstraction (`lib/auth/session.js`) and `/api/auth/session` and `/api/auth/signout`. Until you add IMS OAuth, SAML, or another identity source, no session is created on sign-in, so the app will show the user as signed out.
- **Adding identity**: Use `createSessionCookie(user, options)` in `lib/auth/session.js` from your chosen flow (e.g. after token exchange or after validating a SAML assertion) and set the cookie in the response.
