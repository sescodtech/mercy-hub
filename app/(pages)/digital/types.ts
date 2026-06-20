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

// ─── Nigerian network prefix lookup (for phone-number auto-detect) ───
// Source: NCC-allocated number ranges. Covers the common, stable prefixes;
// ported numbers or newer ranges simply won't match and the user picks
// the network manually — detection never blocks manual selection.
const NETWORK_PREFIXES: Record<string, Network> = {
  // MTN
  "0803": "mtn", "0806": "mtn", "0703": "mtn", "0706": "mtn",
  "0813": "mtn", "0816": "mtn", "0810": "mtn", "0814": "mtn",
  "0903": "mtn", "0906": "mtn", "0913": "mtn", "0916": "mtn",
  // Airtel
  "0802": "airtel", "0808": "airtel", "0708": "airtel", "0812": "airtel",
  "0701": "airtel", "0902": "airtel", "0907": "airtel", "0901": "airtel",
  "0904": "airtel", "0912": "airtel",
  // Glo
  "0805": "glo", "0807": "glo", "0705": "glo", "0815": "glo",
  "0811": "glo", "0905": "glo", "0915": "glo",
  // 9mobile
  "0809": "9mobile", "0817": "9mobile", "0818": "9mobile",
  "0908": "9mobile", "0909": "9mobile",
};

/** Detects the Nigerian network from a local phone number's first 4 digits. */
export function detectNetwork(phone: string): Network | null {
  const digits = phone.replace(/\D/g, "");
  const local  = digits.startsWith("234") ? `0${digits.slice(3)}` : digits;
  const prefix = local.slice(0, 4);
  return NETWORK_PREFIXES[prefix] ?? null;
}
