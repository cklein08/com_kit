import { NextResponse } from 'next/server';

const IMS_USERINFO_URL = 'https://ims-na1.adobelogin.com/ims/userinfo/v2';

/**
 * Proxy to Adobe IMS userinfo. Client sends Authorization: Bearer <token>.
 * Returns user profile (name, email, sub) for display.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }

  const res = await fetch(IMS_USERINFO_URL, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'IMS userinfo failed' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({
    name: data.name,
    email: data.email,
    sub: data.sub,
    account_type: data.account_type,
  });
}
