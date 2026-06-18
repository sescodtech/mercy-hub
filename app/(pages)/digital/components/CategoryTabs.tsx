"use client";

import { Wifi, Phone, Tv, BookOpen, LayoutGrid, Sparkles, Gift, MoreHorizontal } from "lucide-react";
import type { Tab } from "../types";
import { cn } from "@/utils";

const TABS: { id: Tab; label: string; icon: typeof Wifi }[] = [
  { id: "overview",  label: "Overview",     icon: LayoutGrid },
  { id: "data",      label: "Data Bundles", icon: Wifi },
  { id: "airtime",   label: "Airtime",      icon: Phone },
  { id: "cable",     label: "Cable TV",     icon: Tv },
  { id: "education", label: "Exam PINs",    icon: BookOpen },
  { id: "deals",     label: "Hot Deals",    icon: Sparkles },
  { id: "promos",    label: "Promo Products", icon: Gift },
  { id: "other",     label: "Other",        icon: MoreHorizontal },
];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function CategoryTabs({ active, onChange }: Props) {
  return (
    <div
      className="sticky top-0 z-20 border-b"
      style={{ backgroundColor: "var(--color-card-bg, #fff)", borderColor: "var(--color-border, #e5e5e5)" }}
    >
      <div className="container-site px-4 sm:px-6">
        <div className="flex gap-1.5 overflow-x-auto py-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: "var(--color-brand-primary, #d98c2a)",
                        borderColor: "var(--color-brand-primary, #d98c2a)",
                        color: "#fff",
                      }
                    : {
                        backgroundColor: "transparent",
                        borderColor: "var(--color-border, #e5e5e5)",
                        color: "var(--color-text-secondary, #737373)",
                      }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
