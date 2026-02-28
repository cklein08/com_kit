"use client";

import { useState, useEffect, useMemo } from "react";

/**
 * Maps Amplience content type schema URI to React component.
 * Add entries as you add content types (hero, banner, etc.).
 * @see https://github.com/amplience/amplience-sfcc-composable-commerce/blob/main/docs/amplience/amplience-components-list.md
 */
const DEFAULT_COMPONENTS = {
  // Example: "https://sfcc.com/components/hero": HeroComponent,
};

/**
 * Renders Amplience content by schema. Pass either pre-fetched content or fetch by id/key.
 * @param {{ content?: object, fetch?: { id?: string, key?: string }, components?: Record<string, React.ComponentType> }} props
 */
export function AmplienceWrapper({ content: contentProp, fetch: fetchProp, components = {} }) {
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

  if (loading) return <div className="animate-pulse h-20 bg-muted rounded" />;
  if (content == null) return null;
  if (Component) return <Component {...content} />;
  return (
    <pre className="rounded border bg-muted/50 p-4 text-xs overflow-auto max-h-96">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}
