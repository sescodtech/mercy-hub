"use client";

import Link from "next/link";
import { Wifi, Phone, Tv, GraduationCap, Sparkles, ArrowRight, ChevronRight } from "lucide-react";

const SERVICES = [
  {
    label: "Data",
    icon:  Wifi,
    href:  "/digital?category=data",
    color: "#d98c2a",
    bg:    "rgba(217,140,42,0.12)",
  },
  {
    label: "Airtime",
    icon:  Phone,
    href:  "/digital?category=airtime",
    color: "#10b981",
    bg:    "rgba(16,185,129,0.12)",
  },
  {
    label: "Cable TV",
    icon:  Tv,
    href:  "/digital?category=cable",
    color: "#6366f1",
    bg:    "rgba(99,102,241,0.12)",
  },
  {
    label: "Exam PINs",
    icon:  GraduationCap,
    href:  "/digital?category=education",
    color: "#f59e0b",
    bg:    "rgba(245,158,11,0.12)",
  },
  {
    label: "Hot Deals",
    icon:  Sparkles,
    href:  "/digital",
    color: "#ef4444",
    bg:    "rgba(239,68,68,0.12)",
  },
];

export function DigitalServicesSection() {
  return (
    <section className="py-4 bg-white border-b border-neutral-100">
      <div className="container-site">

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-4 rounded-full"
              style={{ backgroundColor: "var(--color-brand-primary, #d98c2a)" }}
            />
            <h2 className="text-sm font-semibold text-neutral-800">Digital Services</h2>
          </div>
          <Link
            href="/digital"
            className="flex items-center gap-0.5 text-xs font-medium"
            style={{ color: "var(--color-brand-primary, #d98c2a)" }}
          >
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Service icons — horizontal scroll row like Jumia quick links */}
        <div className="flex gap-4 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.label}
                href={s.href}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                {/* Icon circle */}
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform active:scale-95"
                  style={{ backgroundColor: s.bg }}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: s.color }} />
                </div>
                {/* Label */}
                <span className="text-[10px] sm:text-[11px] font-medium text-neutral-600 text-center leading-tight">
                  {s.label}
                </span>
              </Link>
            );
          })}

          {/* View All pill at end of row */}
          <Link
            href="/digital"
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border border-dashed"
              style={{ borderColor: "var(--color-border, #e5e5e5)", backgroundColor: "var(--color-page-bg, #fdf8f0)" }}
            >
              <ArrowRight className="w-5 h-5 text-neutral-400" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-neutral-400 text-center leading-tight">
              More
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
