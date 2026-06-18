"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wifi, Phone, Tv, GraduationCap, BookOpen, Sparkles,
  ArrowRight, Zap, ShieldCheck, Clock,
} from "lucide-react";

const SERVICES = [
  {
    label: "Data Bundles",
    desc:  "All networks, instant delivery",
    icon:  Wifi,
    href:  "/digital?category=data",
    color: "#d98c2a",
  },
  {
    label: "Airtime Recharge",
    desc:  "Top up any number in seconds",
    icon:  Phone,
    href:  "/digital?category=airtime",
    color: "#10b981",
  },
  {
    label: "Cable TV",
    desc:  "DStv, GOtv & Startimes",
    icon:  Tv,
    href:  "/digital?category=cable",
    color: "#6366f1",
  },
  {
    label: "Exam PINs",
    desc:  "WAEC, NECO & NABTEB",
    icon:  GraduationCap,
    href:  "/digital?category=education",
    color: "#f59e0b",
  },
  {
    label: "Educational Services",
    desc:  "Result checkers & more",
    icon:  BookOpen,
    href:  "/digital?category=education",
    color: "#ef4444",
  },
  {
    label: "More Digital Deals",
    desc:  "Hot deals & promos",
    icon:  Sparkles,
    href:  "/digital",
    color: "#c47020",
  },
];

const PERKS = [
  { icon: Zap,         text: "Instant delivery" },
  { icon: ShieldCheck, text: "Secure wallet payments" },
  { icon: Clock,       text: "24/7 availability" },
];

export function DigitalServicesSection() {
  return (
    <section
      className="py-12 sm:py-16 relative overflow-hidden"
      style={{ backgroundColor: "var(--color-footer-bg, #1a1208)" }}
    >
      {/* Subtle pattern overlay, matches shop hero treatment */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            var(--color-brand-primary, #d98c2a) 0px,
            var(--color-brand-primary, #d98c2a) 1px,
            transparent 1px,
            transparent 12px
          )`,
        }}
      />

      <div className="relative container-site">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" style={{ color: "var(--color-brand-primary, #d98c2a)" }} />
              <span
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "var(--color-brand-primary, #d98c2a)" }}
              >
                Digital Services
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white leading-tight">
              Data, Airtime, Cable &amp; Exam PINs — sorted in seconds
            </h2>
            <p className="text-sm text-white/50 mt-2 max-w-md">
              Buy data bundles, recharge airtime, pay your cable subscription, and grab exam PINs — all from one wallet, all on Mercy Hub.
            </p>
          </div>

          <Link
            href="/digital"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
            style={{
              backgroundColor: "var(--color-brand-primary, #d98c2a)",
              color: "#fff",
            }}
          >
            Browse Digital Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Service cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={s.href}
                  className="group flex flex-col h-full rounded-2xl p-4 sm:p-5 transition-all duration-200 border"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = `${s.color}55`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.04)";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: `${s.color}22` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug">{s.label}</p>
                  <p className="text-xs text-white/40 mt-1 leading-snug">{s.desc}</p>
                  <div
                    className="mt-3 flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: s.color }}
                  >
                    Buy now <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Perks strip + mobile CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {PERKS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.text} className="flex items-center gap-2 text-xs text-white/50">
                  <Icon className="w-3.5 h-3.5" style={{ color: "var(--color-brand-primary, #d98c2a)" }} />
                  {p.text}
                </div>
              );
            })}
          </div>

          <Link
            href="/digital"
            className="sm:hidden inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold w-full"
            style={{ backgroundColor: "var(--color-brand-primary, #d98c2a)", color: "#fff" }}
          >
            Browse Digital Services <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
