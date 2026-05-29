"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";

interface IBanner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  buttonText?: string;
  position: string;
}

export function HeroSection() {
  const [slides, setSlides] = useState<IBanner[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await axios.get("/api/banners");
        if (data.success) {
          const heroBanners = data.data.filter((b: any) => b.position === "hero" || !b.position);
          setSlides(heroBanners);
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

  if (loading) return <div className="h-[90vh] bg-neutral-900 animate-pulse" />;
  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="relative h-[90vh] min-h-[600px] max-h-[900px] overflow-hidden bg-neutral-900">
      {/* Background images */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={slide._id}
          custom={direction}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative h-full container-site flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide._id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-lg"
          >
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-5"
            >
              <div className="h-px w-10 bg-brand-400" />
              <span className="text-xs tracking-[0.25em] uppercase text-brand-300 font-medium">
                Featured Collection
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.1] mb-5 whitespace-pre-line">
              {slide.title}
            </h1>

            {/* Subheading */}
            <p className="text-base text-white/70 leading-relaxed mb-8 max-w-md">
              {slide.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link href={slide.link || "/shop"} className="btn-primary group">
                {slide.buttonText || "Shop Now"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6">
        {/* Dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-0.5 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-brand-400" : "w-4 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Arrow controls */}
      <button
        onClick={() => go((current - 1 + slides.length) % slides.length)}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => go((current + 1) % slides.length)}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </section>
  );
}
