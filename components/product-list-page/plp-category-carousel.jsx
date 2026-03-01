"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/** Fake category carousel for PLP (Jackets, Purses, Hats) - similar to Mobify reference */
const PLP_CATEGORIES = [
  {
    name: "Jackets",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
    alt: "Women's jackets",
    href: "/content/dam/v0/site/en/new-arrivals/new-arrivals",
  },
  {
    name: "Purses",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
    alt: "Designer purses",
    href: "/content/dam/v0/site/en/new-arrivals/new-arrivals",
  },
  {
    name: "Hats",
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=400&fit=crop",
    alt: "Fashion hats",
    href: "/content/dam/v0/site/en/new-arrivals/new-arrivals",
  },
];

export function PlpCategoryCarousel() {
  return (
    <section className="plp-category-carousel w-full py-8">
      <div className="plp-category-carousel-inner">
        <h2 className="plp-category-carousel-title">Shop by Category</h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="relative w-full overflow-visible px-10 md:px-14"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {PLP_CATEGORIES.map((category) => (
              <CarouselItem
                key={category.name}
                className="pl-2 basis-full sm:basis-1/2 md:basis-1/3"
              >
                <Link
                  href={category.href}
                  className="plp-category-carousel-item group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] bg-zinc-100">
                    <Image
                      src={category.image}
                      alt={category.alt}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      unoptimized
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-zinc-900">{category.name}</p>
                    <span className="text-sm text-zinc-500">Shop Now →</span>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="z-10 -left-10 border-zinc-200 bg-white hover:bg-zinc-50 md:-left-12" />
          <CarouselNext className="z-10 -right-10 border-zinc-200 bg-white hover:bg-zinc-50 md:-right-12" />
        </Carousel>
      </div>
    </section>
  );
}
