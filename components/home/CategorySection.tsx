"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    name:  "Bedding",
    slug:  "bedding",
    desc:  "Soft sheets, duvets & more",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80",
    span:  "lg:col-span-2 lg:row-span-2",
    size:  "large",
  },
  {
    name:  "Kitchenware",
    slug:  "kitchenware",
    desc:  "Cook & entertain in style",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
    span:  "",
    size:  "small",
  },
  {
    name:  "Home Decor",
    slug:  "home-decor",
    desc:  "Beautiful accents & art",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
    span:  "",
    size:  "small",
  },
  {
    name:  "Bath & Body",
    slug:  "bath-body",
    desc:  "Spa-grade essentials",
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80",
    span:  "",
    size:  "small",
  },
  {
    name:  "Lighting",
    slug:  "lighting",
    desc:  "Set the perfect mood",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    span:  "",
    size:  "small",
  },
];

export function CategorySection() {
  return (
    <section className="section-spacing bg-cream">
      <div className="container-site">
        {/* Heading */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="section-tag">Collections</span>
            <h2 className="section-heading">Shop by Category</h2>
          </div>
          <Link href="/shop" className="hidden sm:flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-brand-600 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[220px]">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={cat.span}
            >
              <Link href={`/shop?category=${cat.slug}`} className="group relative block h-full rounded-xl overflow-hidden bg-neutral-200">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="font-display text-white text-xl font-semibold leading-tight">
                    {cat.name}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">{cat.desc}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-brand-300 font-medium opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    Shop Now <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
