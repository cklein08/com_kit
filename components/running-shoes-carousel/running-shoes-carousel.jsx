"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const RUNNING_SHOES = [
  {
    id: "1",
    name: "Velocity Run Pro",
    price: "$129",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    href: "/product/velocity-run-pro",
  },
  {
    id: "2",
    name: "Trail Blaze",
    price: "$149",
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop",
    href: "/product/trail-blaze",
  },
  {
    id: "3",
    name: "Air Flow Lite",
    price: "$99",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop",
    href: "/product/air-flow-lite",
  },
  {
    id: "4",
    name: "Marathon Elite",
    price: "$179",
    image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=400&fit=crop",
    href: "/product/marathon-elite",
  },
  {
    id: "5",
    name: "Sprint Max",
    price: "$119",
    image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop",
    href: "/product/sprint-max",
  },
];

export function RunningShoesCarousel() {
  return (
    <section className="running-shoes-carousel w-full bg-zinc-50 py-10 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900">
          Running shoes
        </h2>
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {RUNNING_SHOES.map((shoe) => (
              <CarouselItem
                key={shoe.id}
                className="pl-2 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <Link
                  href={shoe.href}
                  className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="relative aspect-square bg-zinc-100">
                    <Image
                      src={shoe.image}
                      alt={shoe.name}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized
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
          <CarouselPrevious className="-left-2 border-zinc-200 bg-white hover:bg-zinc-50 md:-left-4" />
          <CarouselNext className="-right-2 border-zinc-200 bg-white hover:bg-zinc-50 md:-right-4" />
        </Carousel>
      </div>
    </section>
  );
}
