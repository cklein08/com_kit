import { NextResponse } from "next/server";
import { createContentItem } from "@/lib/amplience/cma";

/**
 * POST /api/amplience/content/create
 * Body: { label, schemaUri, body, deliveryKey }
 * Creates a new Amplience content item and sets its delivery key.
 * Requires AMPLIENCE_CLIENT_ID, AMPLIENCE_CLIENT_SECRET, and AMPLIENCE_CONTENT_REPOSITORY_ID in env.
 */
export async function POST(request) {
  try {
    const { label, schemaUri, body, deliveryKey } = await request.json();

    if (!schemaUri || typeof schemaUri !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid schemaUri" },
        { status: 400 }
      );
    }
    if (!deliveryKey || typeof deliveryKey !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid deliveryKey" },
        { status: 400 }
      );
    }

    const content = await createContentItem({
      label: label || "New content",
      schemaUri,
      body: body || {},
      deliveryKey,
    });

    return NextResponse.json({
      ok: true,
      id: content.id,
      deliveryId: content.deliveryId,
    });
  } catch (err) {
    const msg = err.message || String(err);
    const status =
      msg.includes("not configured") ||
      msg.includes("AMPLIENCE_") ||
      msg.includes("CONTENT_REPOSITORY")
        ? 503
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
