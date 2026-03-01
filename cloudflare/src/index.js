/**
 * Cloudflare Worker for com_kit – authenticates users via Microsoft Entra ID
 * (like awesomeportal) and proxies to the Next.js app.
 *
 * Flow: User → Worker (auth check) → if not authenticated, redirect to /auth/login
 *       → Microsoft Entra → callback → set session → proxy to APP_ORIGIN
 */
import { Router, withCookies } from 'itty-router';
import { authRouter, withAuthentication } from './auth.js';
import { originComkit } from './origin/comkit.js';

const router = Router({
  catch: (err) => {
    console.error('error', err);
    throw err;
  },
});

router
  // Parse cookies (required for auth)
  .all('*', withCookies)

  // Auth flows – handled by worker
  .all(authRouter.route, authRouter.fetch)

  // From here on, authentication required
  .all('*', withAuthentication)

  // Proxy all other requests to the Next.js app
  .all('*', originComkit);

export default { fetch: router.fetch };
