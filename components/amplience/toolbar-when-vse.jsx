"use client";

import { useSearchParams } from "next/navigation";
import { AmplienceToolbar } from "./toolbar";

/**
 * Renders the Amplience authoring toolbar (Visualization + Environments = "skinning")
 * when the page URL has ?vse= in the query string. Use this to show the toolbar on
 * any route (e.g. http://localhost:3000/?vse=your-vse.staging.bigcontent.io) for testing
 * or when the storefront is opened from Amplience Content Studio.
 */
export function AmplienceToolbarWhenVse() {
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");
  const hubname = searchParams.get("hub") || searchParams.get("hubname") || "";
  const contentId = searchParams.get("contentId") || "";
  const locale = searchParams.get("locale") || "en-US";

  if (!vse) return null;

  return (
    <AmplienceToolbar
      vse={vse}
      hubname={hubname}
      contentId={contentId}
      locale={locale}
    />
  );
}
