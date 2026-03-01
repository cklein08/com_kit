/**
 * Proxies requests to the com_kit Next.js app (APP_ORIGIN).
 * Preserves path, query string, method, headers, and body.
 */
export async function originComkit(request, env) {
  const appOrigin = env.APP_ORIGIN;
  if (!appOrigin) {
    return new Response('APP_ORIGIN not configured', { status: 500 });
  }

  const url = new URL(request.url);
  const targetUrl = new URL(url.pathname + url.search, appOrigin);

  const headers = new Headers(request.headers);
  headers.set('x-forwarded-host', request.headers.get('host') || url.host);
  headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
  headers.set('x-byo-cdn-type', 'cloudflare');

  const req = new Request(targetUrl, {
    method: request.method,
    headers,
    body: request.body,
    duplex: 'half',
  });

  const response = await fetch(req, { cache: 'no-store' });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
