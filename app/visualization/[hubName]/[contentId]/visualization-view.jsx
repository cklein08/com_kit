"use client";

import { useState, useEffect } from "react";
import { AmplienceToolbar } from "@/components/amplience/toolbar";
import { AmplienceWrapper } from "@/components/amplience/wrapper";

/**
 * Client view for Amplience visualization: toolbar (when in Content Studio) + content.
 * When vse is present, subscribes to dc-visualization-sdk for real-time content updates.
 */
export function VisualizationView({ content: initialContent, hubName, contentId, vse, locale }) {
  const [content, setContent] = useState(initialContent);
  const showToolbar = !!vse;

  // Sync server content when it changes (e.g. navigation)
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  // Real-time updates from Content Studio when in iframe with vse
  useEffect(() => {
    if (!vse || typeof globalThis.window === "undefined") return;
    let unsubscribe;
    import("dc-visualization-sdk")
      .then(({ init }) => init())
      .then((sdk) => {
        unsubscribe = sdk.form.changed((model) => {
          const next = model?.content ?? model;
          if (next) setContent(next);
        });
      })
      .catch(() => {});
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [vse]);

  return (
    <div className="min-h-screen flex flex-col">
      {showToolbar && (
        <AmplienceToolbar
          vse={vse}
          hubname={hubName}
          contentId={contentId}
          locale={locale}
        />
      )}
      <main className="flex-1 p-6">
        {content?._meta ? <AmplienceWrapper content={content} /> : null}
        {content === null ? <p className="text-muted-foreground">Content not found.</p> : null}
        {content !== null && !content?._meta ? <p className="text-muted-foreground">Loading…</p> : null}
      </main>
    </div>
  );
}
