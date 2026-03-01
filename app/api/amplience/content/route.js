import { NextResponse } from "next/server";

/**
 * GET /api/amplience/content?id=... or ?key=...
 * Query: id (delivery id) or key (delivery key), optional vse, locale.
 * Uses dynamic import so server-only Amplience client is not in the main Turbopack bundle.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const key = searchParams.get("key");
  const vse = searchParams.get("vse") || undefined;
  const locale = searchParams.get("locale") || undefined;

  if (!id && !key) {
    return NextResponse.json({ error: "Missing id or key" }, { status: 400 });
  }
  try {
    const { getContentById, getContentByKey } = await import("@/lib/amplience/client");
    const content = id
      ? await getContentById(id, { vse, locale })
      : await getContentByKey(key, { vse, locale });
    return NextResponse.json(content);
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.error("[amplience/content] GET error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
