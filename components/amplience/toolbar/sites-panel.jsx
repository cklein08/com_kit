"use client";

import { Button } from "@/components/ui/button";

/**
 * Sites (visualisations) panel: switch which storefront URL to view (skinning).
 * Each site opens the current path + query string on that storefront’s base URL.
 */
export function SitesPanel({ visualisations, currentUrl }) {
  if (!visualisations?.length) return null;

  const openOnSite = (baseUrl) => {
    try {
      const url = new URL(currentUrl || globalThis.location?.href || "/");
      const target = new URL(url.pathname + url.search, baseUrl);
      globalThis.open(target.toString(), "_blank");
    } catch {
      globalThis.open(baseUrl, "_blank");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Open this page on another site (new tab).</p>
      <div className="grid grid-cols-1 gap-1.5">
        {visualisations.map((site) => (
          <Button
            key={site.url}
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => openOnSite(site.url)}
          >
            {site.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
