import { NextResponse } from "next/server";

/**
 * GET /api/amplience/config
 * Returns envs and visualisations from config/amplience.js for the toolbar (skinning).
 * Server-only so the toolbar can show Environments and Sites panels.
 */
export async function GET() {
  try {
    const m = await import("@/config/amplience");
    const config = m.default ?? m;
    return NextResponse.json({
      envs: config.envs || [],
      visualisations: config.visualisations || [],
      themes: config.themes || [],
    });
  } catch (err) {
    return NextResponse.json({ envs: [], visualisations: [], themes: [] });
  }
}
