"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles, Gift, ArrowRight,
  Wifi, Phone, Tv, BookOpen, Package,
  RefreshCw, AlertCircle,
} from "lucide-react";
import type { Promo } from "../types";

// ─── Icon map ────────────────────────────────────────────────
const CAT_ICON: Record<string, typeof Wifi> = {
  data: Wifi, airtime: Phone, cable: Tv, education: BookOpen, other: Package,
};

// ─── Loading skeleton ─────────────────────────────────────────
function PromoSkeleton({ compact }: { compact: boolean }) {
  const count = compact ? 3 : 6;
  return (
    <div className={compact
      ? "grid grid-cols-2 sm:grid-cols-3 gap-3"
      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton rounded-2xl h-28" />
      ))}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  type: "deal" | "promo";
  limit?: number;
  onSelect: (promo: Promo) => void;
  compact?: boolean; // true = teaser strip on Overview tab
}

// ─── Component ───────────────────────────────────────────────
export function PromoGrid({ type, limit, onSelect, compact = false }: Props) {
  const [promos,  setPromos]  = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const accent   = type === "deal" ? "#ef4444" : "#6366f1";
  const HeaderIcon = type === "deal" ? Sparkles : Gift;
  const emptyMsg = type === "deal"
    ? "No hot deals right now — check back soon for limited-time offers."
    : "No promo products right now — check back soon.";

  // ── Fetch ────────────────────────────────────────────────────
  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetch(`/api/digital/promos?type=${type}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then((d: { success: boolean; data?: Promo[]; error?: string }) => {
        if (!alive) return;
        if (d.success) {
          const all = d.data ?? [];
          setPromos(limit ? all.slice(0, limit) : all);
        } else {
          setError(d.error ?? "Failed to load promotions.");
        }
      })
      .catch((e: Error) => {
        if (!alive) return;
        if (e.message.startsWith("Server returned")) {
          setError("Service temporarily unavailable. Please try again.");
        } else {
          setError("Network error — check your connection and retry.");
        }
      })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [type, limit]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  // ── Render: Loading ──────────────────────────────────────────
  if (loading) return <PromoSkeleton compact={compact} />;

  // ── Render: Error ────────────────────────────────────────────
  if (error) {
    return (
      <div className="text-center py-10 rounded-2xl border border-dashed border-red-200 bg-red-50">
        <AlertCircle className="w-7 h-7 mx-auto mb-2 text-red-400" />
        <p className="text-sm text-red-500 mb-3">{error}</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  // ── Render: Empty ────────────────────────────────────────────
  if (promos.length === 0) {
    return (
      <div
        className="text-center py-10 rounded-2xl border border-dashed"
        style={{ borderColor: "var(--color-border, #e5e5e5)" }}
      >
        <HeaderIcon className="w-7 h-7 mx-auto mb-2" style={{ color: accent }} />
        <p className="text-sm text-neutral-400">{emptyMsg}</p>
      </div>
    );
  }

  // ── Render: Promo cards ──────────────────────────────────────
  return (
    <div className={compact
      ? "grid grid-cols-2 sm:grid-cols-3 gap-3"
      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"}
    >
      {promos.map((p) => {
        const PIcon = CAT_ICON[p.category] ?? Package;
        return (
          <button
            key={p._id}
            onClick={() => onSelect(p)}
            className="group flex flex-col h-full text-left rounded-2xl p-4 border transition-all hover:shadow-md active:scale-[0.98]"
            style={{
              backgroundColor: "var(--color-card-bg, #fff)",
              borderColor:     "var(--color-border, #e5e5e5)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = accent;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--color-border, #e5e5e5)";
            }}
          >
            {/* Icon + badge row */}
            <div className="flex items-start justify-between mb-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accent}18` }}
              >
                <PIcon style={{ width: 18, height: 18, color: accent }} />
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

            {/* Title + subtitle */}
            <p className="text-sm font-semibold text-neutral-900 leading-snug">
              {p.title}
            </p>
            {p.subtitle && (
              <p className="text-xs text-neutral-400 mt-0.5 leading-snug">
                {p.subtitle}
              </p>
            )}

            {/* CTA */}
            <div
              className="mt-auto pt-2.5 flex items-center gap-1 text-xs font-semibold"
              style={{ color: accent }}
            >
              {p.ctaLabel ?? "Buy Now"}{" "}
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
