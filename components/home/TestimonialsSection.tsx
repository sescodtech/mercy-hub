"use client";

import { useState } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils";

interface Testimonial {
  _id?: string;
  name: string;
  role?: string;
  text: string;
  rating: number;
  avatar?: string;
  active: boolean;
}

interface Props {
  testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: Props) {
  const active = testimonials.filter((t) => t.active);
  const [current, setCurrent] = useState(0);

  if (active.length === 0) return null;

  const prev = () => setCurrent((c) => (c - 1 + active.length) % active.length);
  const next = () => setCurrent((c) => (c + 1) % active.length);

  // Desktop: show 3 at once; mobile: 1
  const SHOW = 3;
  const desktopItems = active.length >= SHOW
    ? [0, 1, 2].map((offset) => active[(current + offset) % active.length])
    : active;

  return (
    <section
      className="py-16 sm:py-20"
      style={{ backgroundColor: "var(--color-brand-secondary)" }}
    >
      <div className="container-site">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-subheading">Customer Love</p>
          <h2 className="section-heading">What Our Customers Say</h2>
        </div>

        {/* Cards */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {desktopItems.map((t, i) => (
            <TestimonialCard key={`${t._id}-${i}`} testimonial={t} featured={i === 1} />
          ))}
        </div>

        {/* Mobile single */}
        <div className="md:hidden">
          <TestimonialCard testimonial={active[current]} featured />
        </div>

        {/* Navigation */}
        {active.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
              style={{ borderColor: "var(--color-border)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-brand-primary)";
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-brand-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "";
                (e.currentTarget as HTMLElement).style.color = "";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1.5">
              {active.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    backgroundColor: i === current
                      ? "var(--color-brand-primary)"
                      : "var(--color-border)",
                    width: i === current ? "24px" : "8px",
                  }}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-colors"
              style={{ borderColor: "var(--color-border)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-brand-primary)";
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-brand-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "";
                (e.currentTarget as HTMLElement).style.color = "";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial: t, featured }: { testimonial: Testimonial; featured?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl p-6 sm:p-7 flex flex-col transition-all",
        featured ? "shadow-lg scale-[1.02]" : "shadow-sm"
      )}
      style={{
        backgroundColor: featured ? "var(--color-card-bg)" : "var(--color-card-bg)",
        border: featured
          ? "1px solid color-mix(in srgb, var(--color-brand-primary) 30%, transparent)"
          : "1px solid var(--color-border)",
      }}
    >
      <Quote
        className="w-8 h-8 mb-4 opacity-20"
        style={{ color: "var(--color-brand-primary)" }}
      />

      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn("w-4 h-4", n <= t.rating ? "fill-current" : "opacity-20")}
            style={{ color: "var(--color-brand-primary)" }}
          />
        ))}
      </div>

      <p
        className="text-sm leading-relaxed flex-1 italic"
        style={{ color: "var(--color-text-secondary)" }}
      >
        "{t.text}"
      </p>

      <div className="flex items-center gap-3 mt-5 pt-5 border-t" style={{ borderColor: "var(--color-border)" }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ backgroundColor: "var(--color-brand-primary)" }}
        >
          {t.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {t.name}
          </p>
          {t.role && (
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {t.role}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
