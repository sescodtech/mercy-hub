"use client";

import Link from "next/link";
import { ChevronRight, Sparkles, Gift, ArrowRight, Wifi, Phone, Tv, BookOpen } from "lucide-react";
import { CATEGORY_META } from "../types";
import type { Category, Tab, Promo } from "../types";
import { PromoGrid } from "./PromoGrid";

interface Props {
  onSelectTab: (tab: Tab) => void;
  onSelectPromo: (promo: Promo) => void;
}

export function OverviewTab({ onSelectTab, onSelectPromo }: Props) {
  const categories = Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][];

  return (
    <div className="space-y-8">
      {/* Quick category cards */}
      <div>
        <p className="text-neutral-500 text-sm mb-4">What would you like to do today?</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {categories.map(([id, meta]) => (
            <button
              key={id}
              onClick={() => onSelectTab(id)}
              className="bg-white rounded-2xl p-4 sm:p-5 text-left border hover:shadow-md transition-all group"
              style={{ borderColor: "var(--color-border, #e5e5e5)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${meta.color}18` }}
              >
                <CategoryIcon id={id} color={meta.color} />
              </div>
              <p className="font-semibold text-neutral-900 text-sm">{meta.label}</p>
              <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{meta.desc}</p>
              <ChevronRight className="w-4 h-4 text-neutral-300 mt-2 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Hot Deals teaser */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "#ef4444" }} />
            <h2 className="font-display text-lg font-semibold text-neutral-900">Hot Deals</h2>
          </div>
          <button
            onClick={() => onSelectTab("deals")}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            See all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <PromoGrid type="deal" limit={3} onSelect={onSelectPromo} compact />
      </div>

      {/* Promo Products teaser */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" style={{ color: "#6366f1" }} />
            <h2 className="font-display text-lg font-semibold text-neutral-900">Promo Products</h2>
          </div>
          <button
            onClick={() => onSelectTab("promos")}
            className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            See all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <PromoGrid type="promo" limit={3} onSelect={onSelectPromo} compact />
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-center justify-between" style={{ borderColor: "var(--color-border, #e5e5e5)" }}>
        <p className="text-sm font-medium text-neutral-700">Recent Orders</p>
        <Link href="/dashboard/digital-orders" className="text-xs flex items-center gap-1 hover:underline" style={{ color: "var(--color-brand-primary, #d98c2a)" }}>
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

// Small inline icon mapper to avoid re-importing the whole icon set into types.ts
function CategoryIcon({ id, color }: { id: Category; color: string }) {
  const map = { data: Wifi, airtime: Phone, cable: Tv, education: BookOpen };
  const Icon = map[id];
  return <Icon className="w-5.5 h-5.5" style={{ width: 22, height: 22, color }} />;
}
