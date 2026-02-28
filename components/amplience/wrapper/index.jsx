"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { RunningShoesCarousel } from "@/components/running-shoes-carousel/running-shoes-carousel";
import { EditPencilWrapper } from "@/components/amplience/edit-pencil-wrapper";
import { AMPLIENCE_HUB, AMPLIENCE_APP_URL } from "@/lib/constants";

/**
 * Renders Product Carousel content from Amplience (for visualization page).
 */
function ProductCarouselFromContent(content) {
  const config = {
    title: content.title,
    productLineType: content.productLineType || "search",
    searchPhrase: content.searchPhrase,
    category: content.category,
    skus: Array.isArray(content.skus) ? content.skus : undefined,
  };
  return <RunningShoesCarousel config={config} />;
}

/**
 * Schema URI for Product Carousel content type in Amplience.
 * Set this in your Amplience content type schema.
 */
export const PRODUCT_CAROUSEL_SCHEMA =
  "https://amplience.com/components/product-carousel";

/**
 * Maps Amplience content type schema URI to React component.
 * Add entries as you add content types (hero, banner, etc.).
 * @see https://github.com/amplience/amplience-sfcc-composable-commerce/blob/main/docs/amplience/amplience-components-list.md
 */
const DEFAULT_COMPONENTS = {
  [PRODUCT_CAROUSEL_SCHEMA]: ProductCarouselFromContent,
};

/**
 * Builds the Amplience visualization URL for a content item.
 */
function buildVisualizationUrl(contentId, hub, vse) {
  if (!contentId || !hub || !vse) return null;
  const base = typeof window !== "undefined" ? window.location.origin : AMPLIENCE_APP_URL;
  const params = new URLSearchParams({ vse });
  return `${base}/visualization/${encodeURIComponent(hub)}/${encodeURIComponent(contentId)}?${params}`;
}

/**
 * Renders Amplience content by schema. Pass either pre-fetched content or fetch by id/key.
 * When ?vse= or ?cse= is in the URL, shows a pencil edit button linking to Content Studio visualization.
 * @param {{ content?: object, fetch?: { id?: string, key?: string }, components?: Record<string, React.ComponentType> }} props
 */
export function AmplienceWrapper({ content: contentProp, fetch: fetchProp, components = {} }) {
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");
  const hub = searchParams.get("hub") || searchParams.get("hubname") || AMPLIENCE_HUB;

  const [content, setContent] = useState(contentProp);
  const [loading, setLoading] = useState(!!fetchProp && !contentProp);

  // Client-side fetch by id or key when fetch prop is provided (via API route)
  useEffect(() => {
    if (!fetchProp || contentProp) return;
    const q = fetchProp.id ? `id=${encodeURIComponent(fetchProp.id)}` : `key=${encodeURIComponent(fetchProp.key)}`;
    let cancelled = false;
    fetch(`/api/amplience/content?${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((item) => { if (!cancelled) setContent(item); })
      .catch(() => { if (!cancelled) setContent(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchProp?.id, fetchProp?.key, contentProp]);

  const map = useMemo(() => ({ ...DEFAULT_COMPONENTS, ...components }), [components]);
  const schema = content?._meta?.schema;
  const Component = schema ? map[schema] : null;

  const contentId =
    content?.id ??
    content?.deliveryId ??
    content?._meta?.deliveryId ??
    content?.sys?.id;
  const visualizationUrl = vse && contentId ? buildVisualizationUrl(contentId, hub, vse) : null;
  const editLabel = schema ? "content" : "banner";

  if (loading) return <div className="animate-pulse h-20 bg-muted rounded" />;
  if (content == null) return null;

  const rendered = Component ? (
    <Component {...content} />
  ) : (
    <pre className="rounded border bg-muted/50 p-4 text-xs overflow-auto max-h-96">
      {JSON.stringify(content, null, 2)}
    </pre>
  );

  if (visualizationUrl) {
    return (
      <EditPencilWrapper href={visualizationUrl} label={editLabel}>
        {rendered}
      </EditPencilWrapper>
    );
  }

  return rendered;
}
