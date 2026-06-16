import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 4);

// ─── Order Number Generator ───────────────────────────────────
// Format: MHE-YYMMDD-XXXX
// Example: MHE-250612-0047
// Short, readable, includes date for easy reference in WhatsApp chats
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const yy   = String(now.getFullYear()).slice(2);
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const dd   = String(now.getDate()).padStart(2, "0");

  // 4-char random suffix (no ambiguous chars like 0/O, 1/I/L)
  const suffix = nanoid();

  return `MHE-${yy}${mm}${dd}-${suffix}`;
}

// Sync version for backwards compat (non-async callers)
export function generateOrderNumberSync(): string {
  const now = new Date();
  const yy   = String(now.getFullYear()).slice(2);
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const dd   = String(now.getDate()).padStart(2, "0");
  const suffix = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 4)();
  return `MHE-${yy}${mm}${dd}-${suffix}`;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style:                 "currency",
    currency:              "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  });
}

export function calculateDiscount(price: number, comparePrice?: number): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "…";
}

export function getImageUrl(url: string | undefined, fallback = "/images/placeholder.jpg"): string {
  if (!url) return fallback;
  if (url.startsWith("http")) return url;
  return fallback;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Kept for any legacy calls — now reads threshold from arg
export function calculateShipping(subtotal: number, threshold = 100000, defaultCost = 3000): number {
  if (subtotal >= threshold) return 0;
  return defaultCost;
}
