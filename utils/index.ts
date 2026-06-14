import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style:    "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-NG", {
    year:  "numeric",
    month: "long",
    day:   "numeric",
    ...options,
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-")
    .trim();
}

export function generateOrderNumber(): string {
  const prefix = "MHE";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
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

export function isInStock(stock: number, trackInventory: boolean): boolean {
  if (!trackInventory) return true;
  return stock > 0;
}

export function isLowStock(stock: number, threshold: number, track: boolean): boolean {
  if (!track) return false;
  return stock > 0 && stock <= threshold;
}

export function calculateShipping(subtotal: number): number {
  if (subtotal >= 100000) return 0;   // free shipping above ₦100,000
  if (subtotal >= 20000) return 1500;
  return 2500;
}

export function applyDiscount(
  amount: number,
  coupon: { type: "percent" | "fixed" | "free_shipping"; value: number; maxDiscountAmount?: number }
): number {
  if (coupon.type === "free_shipping") return 0;
  if (coupon.type === "fixed") return Math.min(amount, coupon.value);
  const discount = (amount * coupon.value) / 100;
  if (coupon.maxDiscountAmount) return Math.min(discount, coupon.maxDiscountAmount);
  return discount;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      qs.set(k, String(v));
    }
  });
  return qs.toString() ? `?${qs.toString()}` : "";
}

export function starArray(rating: number): (1 | 0.5 | 0)[] {
  return [1, 2, 3, 4, 5].map((i) => {
    if (rating >= i) return 1;
    if (rating >= i - 0.5) return 0.5;
    return 0;
  });
}
