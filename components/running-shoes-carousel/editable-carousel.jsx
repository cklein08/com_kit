"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RunningShoesCarousel } from "./running-shoes-carousel";
import { CarouselEditForm } from "./carousel-edit-form";
import { AMPLIENCE_HUB } from "@/lib/constants";

const DEFAULT_CONTENT_KEY = "home/carousel";

/**
 * Wrapper that fetches Amplience carousel content and shows a pencil edit
 * control when ?vse= is in the URL. Clicking the pencil opens a dialog to edit
 * the carousel (title, product line type, products from catalog).
 *
 * @param {{ contentKey?: string }} props
 * @param {string} [props.contentKey] - Amplience delivery key (default: "home/carousel")
 */
export function EditableCarousel({ contentKey = DEFAULT_CONTENT_KEY }) {
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");
  const hub = searchParams.get("hub") || searchParams.get("hubname") || AMPLIENCE_HUB;
  const localeParam = searchParams.get("locale") || "en-US";

  const [carouselContent, setCarouselContent] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const refetchCarousel = useCallback(() => {
    const params = new URLSearchParams({ key: contentKey });
    if (vse) params.set("vse", vse);
    params.set("locale", localeParam);
    params.set("_t", Date.now().toString());
    fetch(`/api/amplience/content?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && (data._meta || data.title !== undefined)) {
          setCarouselContent(data);
        } else {
          setCarouselContent(null);
        }
      })
      .catch(() => setCarouselContent(null));
  }, [contentKey, vse, localeParam]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    refetchCarousel();
  }, [refetchCarousel]);

  const config = carouselContent
    ? {
        title: carouselContent.title,
        productLineType: carouselContent.productLineType || "search",
        searchPhrase: carouselContent.searchPhrase,
        category: carouselContent.category,
        skus: Array.isArray(carouselContent.skus) ? carouselContent.skus : undefined,
      }
    : undefined;

  const contentId =
    carouselContent?.id ??
    carouselContent?.deliveryId ??
    carouselContent?._meta?.deliveryId ??
    carouselContent?.sys?.id;
  const showPencil = !!vse && !!hub;
  const editTitle = contentId
    ? "Edit carousel"
    : `Create a Product Carousel in Amplience with delivery key "${contentKey}" to enable editing.`;

  const handleSave = async (payload) => {
    if (!contentId) return;
    let res;
    try {
      res = await fetch("/api/amplience/content/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, ...payload }),
      });
    } catch (fetchErr) {
      throw new Error(fetchErr.message || "Network error. Check your connection.");
    }
    const errBody = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = errBody.error || `Save failed (${res.status})`;
      throw new Error(msg);
    }
    refetchCarousel();
  };

  return (
    <div className="relative" data-amplience-carousel-wrapper>
      {showPencil && (
        <button
          type="button"
          onClick={() => setEditDialogOpen(true)}
          title={editTitle}
          className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
          aria-label="Edit carousel"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit carousel</DialogTitle>
          </DialogHeader>
          {!contentId && (
            <p className="text-sm text-muted-foreground">
              Create a Product Carousel in Amplience with delivery key &quot;{contentKey}&quot; to
              enable saving changes.
            </p>
          )}
          <CarouselEditForm
            initialConfig={config}
            contentId={contentId}
            onSave={handleSave}
            onClose={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <RunningShoesCarousel config={config} />
    </div>
  );
}
