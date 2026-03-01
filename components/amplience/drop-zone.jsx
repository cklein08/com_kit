"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AMPLIENCE_COMPONENTS } from "@/lib/amplience/component-registry";
import { AMPLIENCE_HUB } from "@/lib/constants";
import { AmplienceWrapper } from "@/components/amplience/wrapper";

/**
 * Drop zone for adding Amplience content when ?vse= is present.
 * When empty: shows "Add component" overlay; clicking opens component picker.
 * When has content: shows subtle "Edit" affordance.
 *
 * @param {{ slotKey: string, label?: string, isEmpty: boolean, children: React.ReactNode, className?: string }} props
 */
export function DropZone({ slotKey, label, isEmpty, children, className = "" }) {
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");
  const hub = searchParams.get("hub") || searchParams.get("hubname") || AMPLIENCE_HUB;

  if (!vse) {
    return <div className={className}>{children}</div>;
  }

  const contentStudioBase = `https://${hub}.amplience.net`;

  return (
    <div
      className={`relative group min-h-[60px] ${className}`.trim()}
      data-amplience-drop-zone
      data-slot-key={slotKey}
    >
      {isEmpty ? (
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex min-h-[60px] items-center justify-center rounded-md border-2 border-dashed border-zinc-300 bg-zinc-50/50 transition hover:border-zinc-400 hover:bg-zinc-100/80">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-zinc-600 hover:text-zinc-900"
              >
                <Plus className="h-4 w-4" />
                Add component
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              <p className="px-2 py-1 text-xs font-medium text-zinc-500">
                Add to {label || slotKey}
              </p>
              {AMPLIENCE_COMPONENTS.map((comp) => (
                <AddComponentLink
                  key={comp.schemaUri}
                  component={comp}
                  slotKey={slotKey}
                  contentStudioBase={contentStudioBase}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
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

function AddComponentLink({ component, slotKey, contentStudioBase }) {
  const createUrl = `${contentStudioBase}/app/#/content-item/create`;
  const Icon = component.icon;

  return (
    <a
      href={createUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-zinc-100"
      title={`Create ${component.label}. Set delivery key to: ${slotKey}`}
    >
      {Icon ? <Icon className="h-4 w-4 text-zinc-500 shrink-0" /> : null}
      <span>{component.label}</span>
    </a>
  );
}

/**
 * Fetches Amplience content by slot key and renders DropZone + AmplienceWrapper.
 * When no content: shows empty drop zone (when ?vse=) or placeholder. When content exists: renders it with edit affordance.
 * Supports fallbackKey: tries primary key first, then fallback if null.
 *
 * @param {{ slotKey: string, fallbackKey?: string, label?: string, className?: string, placeholder?: React.ReactNode }} props
 */
export function AmplienceSlot({ slotKey, fallbackKey, label, className = "", placeholder }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");

  useEffect(() => {
    let cancelled = false;
    const tryFetch = (key) =>
      fetch(`/api/amplience/content?key=${encodeURIComponent(key)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((item) => {
          if (cancelled) return item;
          const hasContent = item != null && (item._meta || item.headline || item.background || item.image || item.title);
          return hasContent ? item : null;
        });

    tryFetch(slotKey)
      .then((item) => {
        if (cancelled) return;
        if (item != null) {
          setContent(item);
        } else if (fallbackKey) {
          return tryFetch(fallbackKey);
        } else {
          setContent(null);
        }
      })
      .then((fallbackItem) => {
        if (cancelled || fallbackItem === undefined) return;
        setContent(fallbackItem);
      })
      .catch(() => { if (!cancelled) setContent(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slotKey, fallbackKey]);

  if (loading) {
    return <div className={`min-h-[60px] animate-pulse rounded bg-muted ${className}`} />;
  }

  if (!content && !vse) {
    return placeholder ? <div className={className}>{placeholder}</div> : null;
  }

  return (
    <DropZone
      slotKey={slotKey}
      label={label}
      isEmpty={!content}
      className={className}
    >
      {content ? <AmplienceWrapper content={content} /> : null}
    </DropZone>
  );
}
