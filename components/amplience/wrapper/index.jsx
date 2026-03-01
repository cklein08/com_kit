"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { RunningShoesCarousel } from "@/components/running-shoes-carousel/running-shoes-carousel";
import { PlpBanner } from "@/components/amplience/plp-banner";
import { EditPencilWrapper } from "@/components/amplience/edit-pencil-wrapper";
import { AMPLIENCE_HUB, AMPLIENCE_APP_URL } from "@/lib/constants";

/**
 * Schema URI for Product Carousel content type in Amplience.
 */
export const PRODUCT_CAROUSEL_SCHEMA =
  "https://amplience.com/components/product-carousel";

/**
 * Schema URI for Amplience tutorial banner (PLP banner, hero-style).
 * @see https://amplience.com/developers/docs/schema-reference/schema-examples/tutorials/banner/
 */
export const TUTORIAL_BANNER_SCHEMA = "https://schema-examples.com/tutorial-banner";

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
 * Maps Amplience content type schema URI to React component.
 * Add entries as you add content types (hero, banner, etc.).
 * @see https://github.com/amplience/amplience-sfcc-composable-commerce/blob/main/docs/amplience/amplience-components-list.md
 */
const DEFAULT_COMPONENTS = {
  [PRODUCT_CAROUSEL_SCHEMA]: ProductCarouselFromContent,
  [TUTORIAL_BANNER_SCHEMA]: PlpBanner,
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
 * When fetch returns no content and placeholder is provided, renders the placeholder (e.g. demo banner).
 * @param {{ content?: object, fetch?: { id?: string, key?: string, fallbackKey?: string }, components?: Record<string, React.ComponentType>, placeholder?: React.ReactNode }} props
 */
export function AmplienceWrapper({ content: contentProp, fetch: fetchProp, components = {}, placeholder }) {
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");
  const hub = searchParams.get("hub") || searchParams.get("hubname") || AMPLIENCE_HUB;

  const [content, setContent] = useState(contentProp);
  const [loading, setLoading] = useState(!!fetchProp && !contentProp);

  // Client-side fetch by id or key when fetch prop is provided (via API route).
  // When fallbackKey is set, tries primary key first, then fallback if null.
  useEffect(() => {
    if (!fetchProp || contentProp) return;
    const keysToTry = fetchProp.id
      ? [fetchProp.id]
      : [fetchProp.key, fetchProp.fallbackKey].filter(Boolean);
    if (keysToTry.length === 0) return;
    let cancelled = false;
    const tryFetch = (index) => {
      if (cancelled || index >= keysToTry.length) {
        if (!cancelled) setLoading(false);
        return;
      }
      const isId = !!fetchProp.id;
      const keyOrId = keysToTry[index];
      const q = isId ? `id=${encodeURIComponent(keyOrId)}` : `key=${encodeURIComponent(keyOrId)}`;
      fetch(`/api/amplience/content?${q}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((item) => {
          if (cancelled) return;
          if (item != null && (item._meta || item.headline || item.background || item.image)) {
            setContent(item);
            setLoading(false);
          } else if (index + 1 < keysToTry.length) {
            tryFetch(index + 1);
          } else {
            setContent(null);
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (index + 1 < keysToTry.length) {
            tryFetch(index + 1);
          } else {
            setContent(null);
          }
        })
        .finally(() => {
          if (cancelled) return;
          if (index + 1 >= keysToTry.length) setLoading(false);
        });
    };
    tryFetch(0);
    return () => { cancelled = true; };
  }, [fetchProp?.id, fetchProp?.key, fetchProp?.fallbackKey, contentProp]);

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
  if (content == null) return placeholder ?? null;

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
