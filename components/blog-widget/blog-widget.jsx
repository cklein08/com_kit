"use client";

import Image from "next/image";
import Link from "next/link";
import { Pencil } from "lucide-react";
import "./blog-widget.css";

/**
 * BlogWidget - Teaser for AEM blog content fragment.
 * Renders image, title, excerpt, optional author, and "Read more" link.
 * Uses fallback content when no AEM data is available.
 *
 * @param {Object} blog - AEM content fragment data { title, excerpt, image, author, urlSlug, _path }
 * @param {Object} config - { env } AEM author URL for image and editor links
 * @param {boolean} showPencil - Show edit-in-AEM pencil when true (e.g. when ?vse= in URL)
 * @param {string} productSlug - Product slug for fallback editor URL (product page in AEM)
 */
const DEFAULT_BLOG = {
  title: "How to choose the right fit",
  excerpt: "A quick guide to sizing and comfort for all-day wear.",
  image: "https://media.istockphoto.com/id/1210120932/photo/close-up-of-athletic-woman-putting-on-sneakers.jpg?s=612x612&w=0&k=20&c=U4jBfMvYjX0Jl2qj76z2XiMznGlYB9T7dgbFT7HflDw=",
  urlSlug: null,
};

export function BlogWidget({ blog, config, showPencil = false, productSlug }) {
  const data = blog ?? DEFAULT_BLOG;
  const { title, excerpt, image, author, urlSlug, _path } = data;

  const imageAsset = image ?? {};
  const isAemImage = imageAsset._dynamicUrl || imageAsset._authorUrl;
  const imageSrc = isAemImage
    ? `${(config?.env || "").replace(/\/$/, "")}${imageAsset._dynamicUrl || imageAsset._authorUrl}`
    : typeof image === "string"
      ? image
      : null;

  const aemEditorUrl =
    showPencil && config?.env
      ? _path
        ? `${config.env.replace(/\/$/, "")}/editor.html${_path.startsWith("/") ? _path : `/${_path}`}`
        : productSlug
          ? `${config.env.replace(/\/$/, "")}/editor.html/content/site/product/${productSlug}`
          : null
      : null;

  const blogUrl = urlSlug ? `/blog/${urlSlug}` : "/blog";

  return (
    <section className="blog-widget product-detail-widget product-detail-blog-post product-detail-blog-post-right relative">
      <div className="product-detail-blog-post-inner">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span />
          {showPencil && aemEditorUrl && (
            <a
              href={aemEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Edit in AEM"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
              aria-label="Edit blog post in AEM"
            >
              <Pencil className="h-4 w-4" />
            </a>
          )}
        </div>
        {imageSrc && (
          <div className="product-detail-blog-post-image-wrap">
            <Image
              src={imageSrc}
              alt={title || ""}
              width={200}
              height={120}
              className="product-detail-blog-post-image"
            />
          </div>
        )}
        {title && (
          <h3 className="product-detail-blog-post-title">{title}</h3>
        )}
        {excerpt && (
          <p className="product-detail-blog-post-excerpt">{excerpt}</p>
        )}
        {author && (
          <p className="blog-widget-author" data-aue-prop="author">
            {author}
          </p>
        )}
        <Link href={blogUrl} className="product-detail-blog-post-link">
          Read more →
        </Link>
      </div>
    </section>
  );
}
