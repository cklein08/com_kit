"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { RunningShoesCarousel } from "./running-shoes-carousel";
import { AMPLIENCE_APP_URL, AMPLIENCE_HUB } from "@/lib/constants";

const DEFAULT_CONTENT_KEY = "home/carousel";

/**
 * Wrapper that fetches Amplience carousel content and shows a pencil edit
 * control when ?vse= is in the URL. Use on any page where the carousel appears
 * so it is editable in Amplience Content Studio from that page.
 *
 * @param {{ contentKey?: string }} props
 * @param {string} [props.contentKey] - Amplience delivery key (default: "home/carousel")
 */
export function EditableCarousel({ contentKey = DEFAULT_CONTENT_KEY }) {
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse");
  const hub = searchParams.get("hub") || searchParams.get("hubname") || AMPLIENCE_HUB;
  const localeParam = searchParams.get("locale") || "en-US";

  const [carouselContent, setCarouselContent] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams({ key: contentKey });
    if (vse) params.set("vse", vse);
    params.set("locale", localeParam);
    let cancelled = false;
    fetch(`/api/amplience/content?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && (data._meta || data.title !== undefined)) {
          setCarouselContent(data);
        } else if (!cancelled) {
          setCarouselContent(null);
        }
      })
      .catch(() => {
        if (!cancelled) setCarouselContent(null);
      });
    return () => {
      cancelled = true;
    };
  }, [contentKey, vse, localeParam]);

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
  const editHref =
    contentId && showPencil
      ? `${AMPLIENCE_APP_URL}/visualization/${encodeURIComponent(hub)}/${encodeURIComponent(contentId)}?vse=${encodeURIComponent(vse)}`
      : "#";
  const editTitle = contentId
    ? "Edit carousel in Amplience Content Studio"
    : `Create a Product Carousel in Amplience with delivery key "${contentKey}" to enable editing.`;

  return (
    <div className="relative" data-amplience-carousel-wrapper>
      {showPencil && (
        <Link
          href={editHref}
          target={contentId ? "_blank" : undefined}
          rel={contentId ? "noopener noreferrer" : undefined}
          title={editTitle}
          className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
          aria-label="Edit carousel"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      )}
      <RunningShoesCarousel config={config} />
    </div>
  );
}
