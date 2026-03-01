"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmplienceWrapper } from "@/components/amplience/wrapper";
import { AddComponentDialog } from "@/components/amplience/add-component-dialog";

/**
 * Drop zone for adding Amplience content when ?vse= is present.
 * When empty: shows "Add component" above; pencil links to editUrl (AEM or catalog).
 * When has content: AmplienceWrapper provides pencil to Content Studio.
 *
 * @param {{ slotKey: string, label?: string, isEmpty: boolean, children: React.ReactNode, className?: string, editUrl?: string }} props
 */
export function DropZone({ slotKey, label, isEmpty, children, className = "", editUrl }) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");

  if (!vse) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`relative group min-h-[60px] ${className}`.trim()}
      data-amplience-drop-zone
      data-slot-key={slotKey}
    >
      {isEmpty ? (
        <>
          {children ? (
            <>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setAddDialogOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setAddDialogOpen(true);
                  }
                }}
                className="mb-2 flex cursor-pointer items-center justify-end"
              >
                <span className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900">
                  <Plus className="h-4 w-4" />
                  Add component
                </span>
              </div>
              <div className="relative">
                {children}
                {editUrl && (
                  <a
                    href={editUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Edit ${label || "content"}`}
                    aria-label={`Edit ${label || "content"}`}
                    className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
                  >
                    <Pencil className="h-4 w-4" />
                  </a>
                )}
              </div>
            </>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setAddDialogOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setAddDialogOpen(true);
                }
              }}
              className="flex min-h-[60px] cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-zinc-300 bg-zinc-50/50 transition hover:border-zinc-400 hover:bg-zinc-100/80"
            >
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-zinc-600 hover:text-zinc-900 pointer-events-none"
              >
                <Plus className="h-4 w-4" />
                Add component
              </Button>
            </div>
          )}
          <AddComponentDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            slotKey={slotKey}
            label={label || slotKey}
          />
        </>
      ) : (
        <div className="relative">
          {children}
          <div className="absolute top-2 right-2 z-10 opacity-0 transition group-hover:opacity-100">
            <span className="inline-flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-xs text-zinc-600 shadow-sm">
              <Pencil className="h-3 w-3" />
              Edit in Content Studio
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Fetches Amplience content by slot key and renders DropZone + AmplienceWrapper.
 * When no content: shows placeholder with Add component; pencil links to editUrl (AEM).
 * When content exists: AmplienceWrapper provides pencil to Content Studio (catalog).
 * Supports fallbackKey: tries primary key first, then fallback if null.
 *
 * @param {{ slotKey: string, fallbackKey?: string, label?: string, className?: string, placeholder?: React.ReactNode, editUrl?: string }} props
 */
export function AmplienceSlot({ slotKey, fallbackKey, label, className = "", placeholder, editUrl }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");

  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setLoading(true);

    const tryFetch = (key) =>
      fetch(`/api/amplience/content?key=${encodeURIComponent(key)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((item) => {
          if (cancelledRef.current) return item;
          const hasContent = item != null && (item._meta || item.headline || item.background || item.image || item.title);
          return hasContent ? item : null;
        });

    tryFetch(slotKey)
      .then((item) => {
        if (cancelledRef.current) return;
        if (item != null) {
          setContent(item);
        } else if (fallbackKey) {
          return tryFetch(fallbackKey);
        } else {
          setContent(null);
        }
      })
      .then((fallbackItem) => {
        if (cancelledRef.current || fallbackItem === undefined) return;
        setContent(fallbackItem);
      })
      .catch(() => { if (!cancelledRef.current) setContent(null); })
      .finally(() => { if (!cancelledRef.current) setLoading(false); });

    return () => { cancelledRef.current = true; };
  }, [slotKey, fallbackKey]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.slotKey === slotKey) {
        cancelledRef.current = false;
        setLoading(true);
        fetch(`/api/amplience/content?key=${encodeURIComponent(slotKey)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((item) => {
            if (cancelledRef.current) return;
            const hasContent = item != null && (item._meta || item.headline || item.background || item.image || item.title);
            if (hasContent) setContent(item);
            else if (fallbackKey) {
              return fetch(`/api/amplience/content?key=${encodeURIComponent(fallbackKey)}`)
                .then((r) => (r.ok ? r.json() : null))
                .then((fb) => {
                  if (cancelledRef.current) return;
                  const hasFb = fb != null && (fb._meta || fb.headline || fb.background || fb.image || fb.title);
                  setContent(hasFb ? fb : null);
                });
            } else setContent(null);
          })
          .catch(() => { if (!cancelledRef.current) setContent(null); })
          .finally(() => { if (!cancelledRef.current) setLoading(false); });
      }
    };
    if (typeof globalThis.window !== "undefined") {
      globalThis.window.addEventListener("amplience-slot-refresh", handler);
      return () => globalThis.window.removeEventListener("amplience-slot-refresh", handler);
    }
  }, [slotKey, fallbackKey]);

  if (loading) {
    return <div className={`min-h-[60px] animate-pulse rounded bg-muted ${className}`} />;
  }

  if (!content) {
    if (!placeholder) return null;
    if (vse) {
      return (
        <DropZone
          slotKey={slotKey}
          label={label}
          isEmpty
          className={className}
          editUrl={editUrl}
        >
          {placeholder}
        </DropZone>
      );
    }
    return <div className={className}>{placeholder}</div>;
  }

  return (
    <DropZone
      slotKey={slotKey}
      label={label}
      isEmpty={false}
      className={className}
    >
      <AmplienceWrapper content={content} />
    </DropZone>
  );
}
