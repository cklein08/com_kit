"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Build Amplience image URL from image-link format.
 * Supports: { defaultHost, endpoint, name } or { url }
 */
function getAmplienceImageUrl(img) {
  if (!img) return null;
  if (img.url && typeof img.url === "string") return img.url;
  const { defaultHost, endpoint, name } = img;
  if (defaultHost && endpoint && name) {
    return `https://${defaultHost}/i/${endpoint}/${name}`;
  }
  return null;
}

/**
 * Extracts image URL from Amplience banner content.
 * Handles tutorial-banner (background.image) and common variants (image, asset).
 */
function getBannerImageUrl(content) {
  const bg = content.background;
  if (bg?.image) return getAmplienceImageUrl(bg.image);
  if (content.image) return getAmplienceImageUrl(content.image);
  if (content.asset?.url) return content.asset.url;
  return null;
}

/**
 * Renders Amplience PLP banner content (tutorial-banner schema and similar).
 * Schema: https://schema-examples.com/tutorial-banner
 * Fields: headline, strapline, background { image, alt }, link { url, title }
 */
export function PlpBanner({ headline, strapline, background, link, ...rest }) {
  const imgUrl = getBannerImageUrl({ background, ...rest });
  const alt = background?.alt || headline || "Banner";
  const linkUrl = link?.url;
  const linkTitle = link?.title;

  return (
    <section className="plp-banner hero-section banner">
      {imgUrl && (
        <div className="plp-banner-image-wrap">
          <Image
            src={imgUrl}
            alt={alt}
            fill
            className="hero-image"
            sizes="100vw"
            unoptimized
          />
        </div>
      )}
      <div className="hero-overlay" />
      <div className="hero-content">
        {strapline && (
          <p className="hero-subheadline">{strapline}</p>
        )}
        {headline && (
          <h2 className="hero-headline">{headline}</h2>
        )}
        {linkUrl && linkTitle && (
          <Button asChild className="hero-button">
            <Link href={linkUrl}>{linkTitle}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
