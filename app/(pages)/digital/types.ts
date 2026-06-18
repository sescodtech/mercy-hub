// app/(pages)/digital/types.ts
// Shared types for the Digital Services marketplace page and its sub-components.

export type Category  = "data" | "airtime" | "cable" | "education";
export type Network   = "mtn" | "airtel" | "glo" | "9mobile";
export type PayMethod = "wallet" | "paystack";

// Every selectable tab, including the marketplace-discovery tabs
// (overview / deals / promos / other) that aren't purchase categories themselves.
export type Tab = "overview" | Category | "deals" | "promos" | "other";

export interface Plan {
  id: string;
  name: string;
  validity?: string;
  network?: string;
  planType?: string;
  providerPlanId?: string;
  price: number;
  planId?: number;
  provider?: string;
  examName?: string;
  quantity?: number;
}

export interface Promo {
  _id: string;
  type: "deal" | "promo";
  title: string;
  subtitle?: string;
  category: Category | "other";
  badge?: string;
  network?: string;
  providerPlanId?: string;
  ctaLabel?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  expiresAt?: string;
}

export interface PurchaseResult {
  success: boolean;
  message?: string;
  error?: string;
  orderRef?: string;
  pins?: string[];
}

export function fmt(n: number) {
  return `₦${(n || 0).toLocaleString("en-NG")}`;
}

export const CATEGORY_META: Record<Category, { label: string; desc: string; color: string }> = {
  data:      { label: "Data Bundles", desc: "Buy data for any network",   color: "#d98c2a" },
  airtime:   { label: "Airtime",      desc: "Recharge any number",        color: "#10b981" },
  cable:     { label: "Cable TV",     desc: "DStv, GOtv, Startimes",      color: "#6366f1" },
  education: { label: "Education",   desc: "WAEC, NECO, NABTEB pins",    color: "#f59e0b" },
};

export const NETWORKS: { id: Network; label: string }[] = [
  { id: "mtn",     label: "MTN"     },
  { id: "airtel",  label: "Airtel"  },
  { id: "glo",     label: "Glo"     },
  { id: "9mobile", label: "9mobile" },
];

export const CABLE_PROVIDERS = ["dstv", "gotv", "startimes"];
