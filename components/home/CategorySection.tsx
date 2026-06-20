"use client";

import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    name:  "Bedding",
    slug:  "bedding",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&q=80",
  },
  {
    name:  "Kitchenware",
    slug:  "kitchenware",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80",
  },
  {
    name:  "Home Decor",
    slug:  "home-decor",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&q=80",
  },
  {
    name:  "Bath & Body",
    slug:  "bath-body",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=300&q=80",
  },
  {
    name:  "Lighting",
    slug:  "lighting",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80",
  },
  {
    name:  "All",
    slug:  "",
    image: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=300&q=80",
  },
];

export function CategorySection() {
  return (
    <section className="py-4 bg-white border-b border-neutral-100">
      <div className="container-site">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-neutral-800">Shop by Category</h2>
          <Link href="/shop" className="text-xs font-medium" style={{ color: "var(--color-brand-primary, #d98c2a)" }}>
            See all
          </Link>
        </div>

        {/* Horizontal scroll row — Jumia style */}
        <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}>
          {categories.map((cat) => (
            <Link
              key={cat.slug || "all"}
              href={cat.slug ? `/shop?category=${cat.slug}` : "/shop"}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              {/* Circle image */}
              <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full overflow-hidden bg-neutral-100 ring-1 ring-neutral-200">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              </div>
              {/* Label */}
              <span className="text-[10px] sm:text-[11px] font-medium text-neutral-700 text-center leading-tight w-16 sm:w-[72px] truncate">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
