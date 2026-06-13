"use client";

import { cn } from "@/utils";
import type { IColorVariant } from "@/types";

interface Props {
  variants: IColorVariant[];
  selected: IColorVariant | null;
  onChange: (variant: IColorVariant | null) => void;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function ColorSelector({ variants, selected, onChange, showLabel = true, size = "md" }: Props) {
  const active = variants.filter((v) => v.enabled);
  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {showLabel && (
        <p className="text-sm text-neutral-600">
          Color:{" "}
          <span className="font-medium text-neutral-900">
            {selected ? selected.label : <span className="text-neutral-400">Select a color</span>}
          </span>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {active.map((variant) => {
          const isSelected = selected?._id === variant._id;
          const isOOS = variant.stock === 0;

          return (
            <button
              key={variant._id}
              type="button"
              onClick={() => onChange(isSelected ? null : variant)}
              title={`${variant.label}${isOOS ? " — Out of stock" : ""}`}
              disabled={isOOS}
              className={cn(
                SIZE[size],
                "rounded-full border-2 transition-all duration-200 relative flex-shrink-0",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d98c2a]",
                isSelected
                  ? "border-[#d98c2a] scale-110 shadow-md ring-2 ring-[#d98c2a]/30 ring-offset-1"
                  : "border-neutral-200 hover:border-neutral-400 hover:scale-105",
                isOOS && "opacity-40 cursor-not-allowed"
              )}
              style={{ backgroundColor: variant.colorHex }}
            >
              {/* Out of stock diagonal slash */}
              {isOOS && (
                <span
                  className="absolute inset-0 rounded-full overflow-hidden"
                  aria-hidden="true"
                >
                  <span
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top right, transparent calc(50% - 1px), rgba(255,255,255,0.7), transparent calc(50% + 1px))",
                    }}
                  />
                </span>
              )}
              <span className="sr-only">
                {variant.label}{isOOS ? " (Out of stock)" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {selected && selected.stock <= 5 && selected.stock > 0 && (
        <p className="text-xs text-orange-600 font-medium">
          Only {selected.stock} left in stock
        </p>
      )}
      {selected && selected.stock === 0 && (
        <p className="text-xs text-red-500 font-medium">
          This color is currently out of stock
        </p>
      )}
    </div>
  );
}
