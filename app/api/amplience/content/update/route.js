import { NextResponse } from "next/server";
import { updateContentItem } from "@/lib/amplience/cma";

/**
 * POST /api/amplience/content/update
 * Body: { contentId, title?, productLineType?, searchPhrase?, category?, skus? }
 * Updates the Amplience content item with the given carousel fields.
 * Requires AMPLIENCE_CLIENT_ID and AMPLIENCE_CLIENT_SECRET in env.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { contentId, title, productLineType, searchPhrase, category, skus } =
      body;

    if (!contentId || typeof contentId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid contentId" },
        { status: 400 }
      );
    }

    const bodyUpdate = {
      title: title ?? "",
      productLineType: productLineType ?? "search",
      searchPhrase: searchPhrase ?? "",
      category: category ?? "",
      skus: Array.isArray(skus) ? skus : [],
    };

    await updateContentItem(contentId, bodyUpdate);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err.message || String(err);
    const status =
      msg.includes("not configured") || msg.includes("AMPLIENCE_CLIENT")
        ? 503
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
