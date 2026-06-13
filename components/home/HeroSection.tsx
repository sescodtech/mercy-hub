"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/utils";

interface HeroCMS {
  headline?: string;
  subheadline?: string;
  ctaPrimaryText?: string;
  ctaPrimaryUrl?: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
  image?: string;
  bgImage?: string;
  overlay?: boolean;
  overlayOpacity?: number;
  textPosition?: "left" | "center" | "right";
}

interface Props {
  hero?: HeroCMS;
}

const DEFAULTS: Required<HeroCMS> = {
  headline:         "Elevate Your Home",
  subheadline:      "Discover premium home essentials crafted for modern Nigerian living.",
  ctaPrimaryText:   "Shop Collection",
  ctaPrimaryUrl:    "/shop",
  ctaSecondaryText: "",
  ctaSecondaryUrl:  "",
  image:            "",
  bgImage:          "",
  overlay:          true,
  overlayOpacity:   50,
  textPosition:     "left",
};

const ALIGN: Record<string, string> = {
  left:   "items-start text-left",
  center: "items-center text-center",
  right:  "items-end text-right",
};

export function HeroSection({ hero = {} }: Props) {
  const d = { ...DEFAULTS, ...hero };
  const hasImage = !!(d.image || d.bgImage);
  const pos       = d.textPosition ?? "left";

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden flex items-center",
        hasImage ? "min-h-[70vh] sm:min-h-[80vh]" : "min-h-[60vh]"
      )}
      style={{
        backgroundColor: hasImage ? "#1a1208" : "var(--color-brand-secondary)",
      }}
    >
      {/* Background image */}
      {(d.bgImage || d.image) && (
        <div className="absolute inset-0">
          <Image
            src={d.bgImage || d.image}
            alt="Hero background"
            fill priority
            className="object-cover"
            sizes="100vw"
          />
          {d.overlay && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: `rgba(26, 18, 8, ${(d.overlayOpacity ?? 50) / 100})`,
              }}
            />
          )}
        </div>
      )}

      {/* Right-side foreground image (when no bgImage) */}
      {d.image && !d.bgImage && (
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
          <Image
            src={d.image}
            alt="Hero product"
            fill priority
            className="object-cover object-center"
            sizes="50vw"
          />
          {/* Gradient blend */}
          <div
            className="absolute inset-y-0 left-0 w-32"
            style={{
              background: "linear-gradient(to right, var(--color-brand-secondary), transparent)",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className={cn(
        "container-site relative z-10 py-20 sm:py-28 flex flex-col",
        ALIGN[pos]
      )}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={cn("max-w-2xl space-y-6", pos === "center" && "mx-auto")}
        >
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="section-subheading"
          >
            Premium Home Goods
          </motion.p>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={cn(
              "font-display font-semibold leading-tight",
              "text-4xl sm:text-5xl lg:text-6xl xl:text-7xl",
              hasImage ? "text-white" : ""
            )}
            style={{ color: hasImage ? "#ffffff" : "var(--color-text-primary)" }}
          >
            {d.headline}
          </motion.h1>

          {/* Subheadline */}
          {d.subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className={cn("text-lg sm:text-xl leading-relaxed", hasImage ? "text-white/80" : "")}
              style={{ color: hasImage ? "rgba(255,255,255,0.75)" : "var(--color-text-secondary)" }}
            >
              {d.subheadline}
            </motion.p>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className={cn("flex flex-wrap gap-4", pos === "center" && "justify-center")}
          >
            {d.ctaPrimaryText && d.ctaPrimaryUrl && (
              <Link href={d.ctaPrimaryUrl} className="btn-primary gap-2 px-8 py-4 text-base">
                {d.ctaPrimaryText}
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            {d.ctaSecondaryText && d.ctaSecondaryUrl && (
              <Link
                href={d.ctaSecondaryUrl}
                className={cn(
                  "btn-secondary gap-2 px-8 py-4 text-base",
                  hasImage && "border-white/40 text-white hover:border-white"
                )}
              >
                {d.ctaSecondaryText}
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
