"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { searchProducts, getProductsBySkus } from "@/lib/api/plp";
import {
  CATALOG_VIEW_ID,
  DEFAULT_LOCALE,
  DEFAULT_PRICE_BOOK,
} from "@/lib/constants";

/** @typedef {'search'|'category'|'skuList'} ProductLineType */

/**
 * Carousel config (from Amplience or defaults).
 * @typedef {{
 *   title?: string;
 *   productLineType?: ProductLineType;
 *   searchPhrase?: string;
 *   category?: string;
 *   skus?: string[];
 * }} CarouselConfig
 */

const DEFAULT_CONFIG = {
  title: "Running shoes",
  productLineType: "search",
  searchPhrase: "running shoes",
};

function formatPrice(priceType) {
  if (
    !priceType?.amount ||
    typeof priceType.amount.value !== "number" ||
    !priceType.amount.currency
  ) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: priceType.amount.currency,
  }).format(priceType.amount.value);
}

const PLACEHOLDER_SHOES = [
  {
    sku: "velocity-run-pro",
    name: "Velocity Run Pro",
    price: "$129",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
  },
  {
    sku: "trail-blaze",
    name: "Trail Blaze",
    price: "$149",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
  },
  {
    sku: "air-flow-lite",
    name: "Air Flow Lite",
    price: "$99",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop",
  },
  {
    sku: "marathon-elite",
    name: "Marathon Elite",
    price: "$179",
    image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=400&fit=crop",
  },
  {
    sku: "sprint-max",
    name: "Sprint Max",
    price: "$119",
    image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop",
  },
];

function productToItem(p) {
  return {
    sku: p.sku,
    name: p.name,
    price: formatPrice(p.price?.final ?? p.price?.regular),
    image: p.images?.[0]?.url || "/placeholder.svg",
  };
}

export function RunningShoesCarousel({ config: configProp }) {
  const config = { ...DEFAULT_CONFIG, ...configProp };
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const type = config.productLineType || "search";

    if (type === "skuList" && Array.isArray(config.skus) && config.skus.length > 0) {
      getProductsBySkus(
        config.skus,
        CATALOG_VIEW_ID,
        DEFAULT_LOCALE,
        DEFAULT_PRICE_BOOK
      )
        .then((list) => {
          if (!cancelled) setProducts(list.map(productToItem));
        })
        .catch(() => { if (!cancelled) setProducts(PLACEHOLDER_SHOES); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }

    if (type === "category" && config.category) {
      searchProducts(
        CATALOG_VIEW_ID,
        DEFAULT_LOCALE,
        DEFAULT_PRICE_BOOK,
        "",
        50,
        1
      )
        .then((result) => {
          if (!cancelled && result?.products?.length) {
            const filtered = result.products.filter(
              (p) => (p.category || "").toLowerCase() === config.category.toLowerCase()
            );
            setProducts(
              filtered.length >= 3
                ? filtered.map(productToItem)
                : result.products.slice(0, 10).map(productToItem)
            );
          } else if (!cancelled) setProducts(PLACEHOLDER_SHOES);
        })
        .catch(() => { if (!cancelled) setProducts(PLACEHOLDER_SHOES); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }

    const phrase = (config.searchPhrase || "").trim() || "running shoes";
    searchProducts(
      CATALOG_VIEW_ID,
      DEFAULT_LOCALE,
      DEFAULT_PRICE_BOOK,
      phrase,
      10,
      1
    )
      .then((result) => {
        if (!cancelled && result?.products?.length >= 3) {
          setProducts(result.products.map(productToItem));
        } else if (!cancelled) {
          setProducts(PLACEHOLDER_SHOES);
        }
      })
      .catch(() => {
        if (!cancelled) setProducts(PLACEHOLDER_SHOES);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    config.productLineType,
    config.searchPhrase,
    config.category,
    config.skus?.join(","),
  ]);

  const items = products.length ? products : PLACEHOLDER_SHOES;

  return (
    <section className="running-shoes-carousel w-full bg-zinc-50 py-10 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
          {config.title || DEFAULT_CONFIG.title}
        </h2>
        {loading ? (
          <div className="flex justify-center py-12 text-zinc-500">
            Loading…
          </div>
        ) : (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="relative w-full overflow-visible px-10 md:px-14"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {items.map((shoe) => (
                <CarouselItem
                  key={shoe.sku}
                  className="pl-2 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <Link
                    href={`/product/${shoe.sku}`}
                    className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="relative aspect-square bg-zinc-100">
                      <Image
                        src={shoe.image}
                        alt={shoe.name}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        unoptimized={shoe.image.startsWith("http")}
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-zinc-900">{shoe.name}</p>
                      <p className="text-sm font-semibold text-zinc-600">
                        {shoe.price}
                      </p>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="z-10 -left-10 border-zinc-200 bg-white hover:bg-zinc-50 md:-left-12" />
            <CarouselNext className="z-10 -right-10 border-zinc-200 bg-white hover:bg-zinc-50 md:-right-12" />
          </Carousel>
        )}
      </div>
    </section>
  );
}
