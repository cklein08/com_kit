"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditPencilWrapper } from "@/components/amplience/edit-pencil-wrapper";

/**
 * Shoppable image with product hotspots - similar to Mobify reference.
 * Image cropped to show only the woman (no car). Hover shows product preview.
 * @see https://ascc-production.mobify-storefront.com/global/en-GB/category/womens
 */
const SHOPPABLE_IMAGE = {
  src: "https://cdn.media.amplience.net/i/sfcccomposable/shoppable-poi-womens-festival-amos-bar-zeev-hVk6pIFbW9o-unsplash?w=600&h=800&sm=c&poi=0.5,0.25,0.5,0.5&scaleFit=poi&qlt=80&fmt=auto",
  alt: "Woman in fashion outfit",
};

function formatPrice(price) {
  if (!price?.amount || typeof price.amount.value !== "number" || !price.amount.currency) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.amount.currency,
  }).format(price.amount.value);
}

/** Fake products for shoppable image callouts */
const FAKE_PRODUCTS = [
  {
    name: "Gold Tortoise Aviator Sunglasses",
    price: { amount: { value: 12.90, currency: "USD" } },
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=80&h=80&fit=crop",
    href: "https://stylitics-store.myshopify.com/products/gold-tortoise-aviator-sunglasses",
    external: true,
  },
  {
    name: "Necklace",
    price: { amount: { value: 45.00, currency: "USD" } },
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=80&h=80&fit=crop",
    href: "/content/dam/v0/site/en/new-arrivals/new-arrivals",
  },
  {
    name: "Sleeveless Shell",
    price: { amount: { value: 47.36, currency: "GBP" } },
    image: "https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw84786754/images/large/PG.10235354.JJ5AAXX.PZ.jpg?sw=680&q=60",
    href: "/product/25593169M",
  },
];

/** Hotspots on the girl: sunglasses, necklace, top */
function buildHotspots() {
  return [
    { top: "25%", left: "38%", label: "Sunglasses", product: FAKE_PRODUCTS[0] },
    { top: "42%", left: "58%", label: "Necklace", product: FAKE_PRODUCTS[1] },
    { top: "59%", left: "42%", label: "Top", product: FAKE_PRODUCTS[2] },
  ];
}

/** Mobify-style hotspot: rounded rect with gradient shimmer animation */
function HotspotIcon() {
  return <div className="plp-shoppable-hotspot-icon" />;
}

function HotspotPreview({ spot }) {
  const product = spot.product;
  return (
    <div className="plp-shoppable-preview">
      <div className="plp-shoppable-preview-image">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover"
          sizes="80px"
          unoptimized={product.image?.startsWith("http")}
        />
      </div>
      <div className="plp-shoppable-preview-info">
        <p className="plp-shoppable-preview-name">{product.name}</p>
        <p className="plp-shoppable-preview-price">
          {formatPrice(product.price)}
        </p>
      </div>
    </div>
  );
}

export function PlpShoppableImage({ editUrl }) {
  const hotspots = buildHotspots();
  const content = (
    <TooltipProvider delayDuration={200}>
      <div className="plp-shoppable-image">
        <div className="plp-shoppable-image-inner">
          <Image
            src={SHOPPABLE_IMAGE.src}
            alt={SHOPPABLE_IMAGE.alt}
            fill
            className="plp-shoppable-image-img"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
          />
          {hotspots.map((spot, i) => (
            <Tooltip key={`${spot.top}-${spot.left}-${spot.label}`}>
              <TooltipTrigger asChild>
                <Link
                  href={spot.product.href}
                  className="plp-shoppable-hotspot"
                  style={{
                    top: spot.top,
                    left: spot.left,
                    animationDelay: `${0.3 + i * 0.05}s`,
                  }}
                  aria-label={spot.label}
                  {...(spot.product.external && {
                    target: "_blank",
                    rel: "noopener noreferrer",
                  })}
                >
                  <HotspotIcon />
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={12}
                className="p-0 border-0 bg-transparent shadow-none"
              >
                <HotspotPreview spot={spot} />
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
  if (editUrl) {
    return (
      <EditPencilWrapper
        href={editUrl}
        label="shoppable image (catalog: 3 hot zones + background image)"
        className="plp-shoppable-edit-wrapper"
      >
        {content}
      </EditPencilWrapper>
    );
  }
  return content;
}
