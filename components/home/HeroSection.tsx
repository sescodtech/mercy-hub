"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";

interface IBanner {
  _id?: string;
  id?: number;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  buttonText?: string;
  position?: string;
  tag?: string;
  heading?: string;
  subheading?: string;
  cta?: string;
  ctaHref?: string;
}

const HARDCODED_SLIDES: IBanner[] = [
  {
    id: 1,
    tag: "New Collection 2025",
    heading: "Elevate Every\nCorner of Home",
    subheading: "Premium home essentials designed for those who appreciate the art of beautiful living.",
    cta: "Shop New Arrivals",
    ctaHref: "/shop?filter=new",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&q=80",
    position: "left",
  },
  {
    id: 2,
    tag: "Curated Bedding",
    heading: "Sleep in\nPure Luxury",
    subheading: "Egyptian cotton, temperature-regulating weaves and hand-finished details for your sanctuary.",
    cta: "Explore Bedding",
    ctaHref: "/shop?category=bedding",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&q=80",
    position: "right",
  },
  {
    id: 3,
    tag: "Kitchen & Dining",
    heading: "Cook, Serve,\nEntertain",
    subheading: "Timeless kitchenware that turns everyday cooking into an artful experience.",
    cta: "Shop Kitchenware",
    ctaHref: "/shop?category=kitchenware",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80",
    position: "left",
  },
];

export function HeroSection() {
  const [slides, setSlides] = useState<IBanner[]>(HARDCODED_SLIDES);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await axios.get("/api/banners");
        if (data.success && data.data.length > 0) {
          const apiHeroBanners = data.data.filter((b: any) => b.position === "hero" || !b.position);
          setSlides([...apiHeroBanners, ...HARDCODED_SLIDES]);
        }
      } catch (error) {
        console.error("Failed to fetch hero banners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const go = (idx: number) => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  // Skeleton matches new reduced height
  if (loading) return <div className="h-[55vh] sm:h-[60vh] bg-neutral-900 animate-pulse" />;
  if (slides.length === 0) return null;

  const slide = slides[current];
  const displayTitle    = slide.title    || slide.heading    || "Premium Home Essentials";
  const displaySubtitle = slide.subtitle || slide.subheading || "";
  const displayCTA      = slide.buttonText || slide.cta      || "Shop Now";
  const displayHref     = slide.link    || slide.ctaHref     || "/shop";
  const displayTag      = slide.tag     || "Featured Collection";

  return (
    /*
     * Height reduced from h-[90vh] to h-[55vh] on mobile, h-[60vh] on sm,
     * h-[65vh] on md, capped at max-h-[700px] so content is always
     * above-the-fold. min-h keeps it usable on very small screens.
     */
    <section className="relative h-[55vh] sm:h-[60vh] md:h-[65vh] min-h-[400px] max-h-[700px] overflow-hidden bg-neutral-900">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={slide._id || slide.id}
          custom={direction}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={displayTitle}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content — tighter vertical padding on mobile */}
      <div className="relative h-full container-site flex items-center px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide._id || slide.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`max-w-xs sm:max-w-sm md:max-w-lg ${slide.position === "right" ? "ml-auto text-right" : ""}`}
          >
            {/* Tag line */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-3 sm:mb-4"
            >
              <div className="h-px w-8 bg-brand-400" />
              <span className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase text-brand-300 font-medium">
                {displayTag}
              </span>
            </motion.div>

            {/* Heading — scaled down on mobile */}
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] mb-3 sm:mb-4 whitespace-pre-line">
              {displayTitle}
            </h1>

            {/* Subtitle — hidden on very small screens to keep it clean */}
            <p className="hidden sm:block text-sm md:text-base text-white/70 leading-relaxed mb-5 md:mb-7 max-w-xs md:max-w-md">
              {displaySubtitle}
            </p>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <Link href={displayHref} className="btn-primary group text-sm sm:text-base px-4 py-2.5 sm:px-6 sm:py-3">
                {displayCTA}
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide dots — closer to bottom on reduced hero */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-0.5 rounded-full transition-all duration-300 ${
                i === current ? "w-6 sm:w-8 bg-brand-400" : "w-3 sm:w-4 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Prev / Next arrows — smaller on mobile */}
      <button
        onClick={() => go((current - 1 + slides.length) % slides.length)}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        aria-label="Previous"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      <button
        onClick={() => go((current + 1) % slides.length)}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        aria-label="Next"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </section>
  );
}
