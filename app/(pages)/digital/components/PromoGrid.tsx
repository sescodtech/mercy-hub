"use client";

import { useEffect, useState } from "react";
import { Sparkles, Gift, ArrowRight, Wifi, Phone, Tv, BookOpen, Package } from "lucide-react";
import type { Promo, Category } from "../types";

const CAT_ICON: Record<string, typeof Wifi> = {
  data: Wifi, airtime: Phone, cable: Tv, education: BookOpen, other: Package,
};

interface Props {
  type: "deal" | "promo";
  limit?: number;
  onSelect: (promo: Promo) => void;
  compact?: boolean; // true = teaser strip on Overview tab, false = full grid on dedicated tab
}

export function PromoGrid({ type, limit, onSelect, compact = false }: Props) {
  const [promos,  setPromos]  = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/digital/promos?type=${type}`)
      .then((r) => r.json())
      .then((d) => { if (alive && d.success) setPromos(limit ? d.data.slice(0, limit) : d.data); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [type, limit]);

  const Icon = type === "deal" ? Sparkles : Gift;
  const accent = type === "deal" ? "#ef4444" : "#6366f1";
  const emptyText = type === "deal"
    ? "No hot deals right now — check back soon for limited-time offers."
    : "No promo products right now — check back soon.";

  if (loading) {
    return (
      <div className={compact ? "grid grid-cols-2 sm:grid-cols-3 gap-3" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"}>
        {Array.from({ length: compact ? 3 : 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  if (promos.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl border border-dashed" style={{ borderColor: "var(--color-border, #e5e5e5)" }}>
        <Icon className="w-7 h-7 mx-auto mb-2" style={{ color: accent }} />
        <p className="text-sm text-neutral-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={compact ? "grid grid-cols-2 sm:grid-cols-3 gap-3" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"}>
      {promos.map((p) => {
        const PIcon = CAT_ICON[p.category] || Package;
        return (
          <button
            key={p._id}
            onClick={() => onSelect(p)}
            className="group flex flex-col h-full text-left rounded-2xl p-4 border transition-all hover:shadow-md"
            style={{ backgroundColor: "var(--color-card-bg, #fff)", borderColor: "var(--color-border, #e5e5e5)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = accent; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border, #e5e5e5)"; }}
          >
            <div className="flex items-start justify-between mb-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accent}18` }}
              >
                <PIcon className="w-4.5 h-4.5" style={{ width: 18, height: 18, color: accent }} />
              </div>
              {p.badge && (
                <span
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: accent }}
                >
                  {p.badge}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-neutral-900 leading-snug">{p.title}</p>
            {p.subtitle && <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{p.subtitle}</p>}
            <div className="mt-2.5 flex items-center gap-1 text-xs font-semibold" style={{ color: accent }}>
              {p.ctaLabel || "Buy Now"} <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
