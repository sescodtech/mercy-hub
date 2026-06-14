"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ViewAllLink() {
  return (
    <Link
      href="/shop"
      className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors"
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color =
          "var(--color-brand-primary, #d98c2a)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = "";
      }}
    >
      View All <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );
}
