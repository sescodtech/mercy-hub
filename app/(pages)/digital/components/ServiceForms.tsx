"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search, Check, X, PackageSearch } from "lucide-react";
import { NETWORKS, CABLE_PROVIDERS, fmt } from "../types";
import type { Network, Plan } from "../types";
import { cn } from "@/utils";

// ═══════════════════════════════════════════════════════════
//  SHARED TYPES
// ═══════════════════════════════════════════════════════════
interface BaseProps {
  plans:      Plan[];
  planLoad:   boolean;
  planError?: string;
  plan:       Plan | null;
  setPlan:    (p: Plan | null) => void;
}

// ═══════════════════════════════════════════════════════════
//  NETWORK BRAND CONFIG  (OPay/PalmPay-style colours)
// ═══════════════════════════════════════════════════════════
const NET_BRAND: Record<Network, {
  color: string; bg: string; border: string; text: string; ring: string;
  gradient: string;
}> = {
  mtn:       { color: "#FFCC00", bg: "#FFFBE6", border: "#FFE066", text: "#7A5900", ring: "#FFCC00", gradient: "linear-gradient(135deg,#FFDE00,#FFA500)" },
  airtel:    { color: "#EE0000", bg: "#FFF0F0", border: "#FFB3B3", text: "#8B0000", ring: "#EE0000", gradient: "linear-gradient(135deg,#FF0000,#CC0000)" },
  glo:       { color: "#009A44", bg: "#EDFBF3", border: "#86EFAC", text: "#005C29", ring: "#009A44", gradient: "linear-gradient(135deg,#00B850,#007A35)" },
  "9mobile": { color: "#00A86B", bg: "#ECFDF5", border: "#6EE7B7", text: "#00503A", ring: "#00A86B", gradient: "linear-gradient(135deg,#00C080,#008050)" },
};

// ═══════════════════════════════════════════════════════════
//  INLINE SVG NETWORK LOGOS  (no external images needed)
// ═══════════════════════════════════════════════════════════
function MtnLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#FFCC00"/>
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#1A1A1A" letterSpacing="-0.5">
        MTN
      </text>
    </svg>
  );
}
function AirtelLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#EE0000"/>
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="8.5" fill="#FFFFFF" letterSpacing="-0.3">
        AIRTEL
      </text>
    </svg>
  );
}
function GloLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#009A44"/>
      <circle cx="20" cy="20" r="13" fill="none" stroke="#FFFFFF" strokeWidth="3"/>
      <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="10" fill="#FFFFFF" letterSpacing="0">
        GLO
      </text>
    </svg>
  );
}
function NineMobileLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#007B5E"/>
      <text x="50%" y="42%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="12" fill="#FFFFFF">
        9
      </text>
      <text x="50%" y="68%" dominantBaseline="middle" textAnchor="middle"
        fontFamily="Arial,sans-serif" fontWeight="700" fontSize="7" fill="#FFFFFF" letterSpacing="0.3">
        mobile
      </text>
    </svg>
  );
}

const NET_LOGO: Record<Network, React.FC<{ size?: number }>> = {
  mtn:       MtnLogo,
  airtel:    AirtelLogo,
  glo:       GloLogo,
  "9mobile": NineMobileLogo,
};

// ═══════════════════════════════════════════════════════════
//  PLAN TYPE FILTER PILLS
// ═══════════════════════════════════════════════════════════
const PLAN_TYPE_TABS = [
  { id: "all",       label: "All"        },
  { id: "sme",       label: "SME"        },
  { id: "sme2",      label: "SME 2.0"    },
  { id: "corporate", label: "Corporate"  },
  { id: "gifting",   label: "Gifting"    },
  { id: "special",   label: "Special"    },
  { id: "awoof",     label: "Awoof"      },
  { id: "datashare", label: "Data Share" },
  { id: "talkmore",  label: "Talk More"  },
];

// ═══════════════════════════════════════════════════════════
//  SKELETON LOADER  — cards are direct grid children (fixes
//  the layout bug that made plans render as one tall scattered
//  column instead of a proper card grid)
// ═══════════════════════════════════════════════════════════
function DataPlanSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-neutral-100 animate-pulse h-[92px] sm:h-[100px]" />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  NETWORK SELECTOR  — OPay/PalmPay-style logo chip
// ═══════════════════════════════════════════════════════════
function NetworkSelector({
  value, onChange,
}: {
  value: Network | "";
  onChange: (n: Network) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {NETWORKS.map(({ id, label }) => {
        const brand    = NET_BRAND[id];
        const Logo     = NET_LOGO[id];
        const selected = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="relative flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all"
            style={{
              borderColor:     selected ? brand.color : "var(--color-border, #e5e5e5)",
              backgroundColor: selected ? brand.bg     : "var(--color-card-bg, #fff)",
            }}
          >
            <Logo size={28} />
            <span
              className="text-[10px] font-semibold"
              style={{ color: selected ? brand.text : "var(--color-text-secondary, #737373)" }}
            >
              {label}
            </span>
            {selected && (
              <span
                className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: brand.color }}
              >
                <Check className="w-2 h-2 text-white" strokeWidth={3.5} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PHONE INPUT with NG flag prefix
// ═══════════════════════════════════════════════════════════
function PhoneInput({
  value, onChange, accentColor,
}: {
  value: string;
  onChange: (v: string) => void;
  accentColor?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
        Phone Number
      </label>
      <div
        className="flex items-center rounded-xl border-2 overflow-hidden transition-all"
        style={{ borderColor: value ? (accentColor ?? "#d98c2a") : "#e5e5e5" }}
      >
        <div className="flex items-center gap-1.5 px-3 py-2.5 border-r border-neutral-200 bg-neutral-50 flex-shrink-0">
          <span className="text-sm leading-none">🇳🇬</span>
          <span className="text-xs font-semibold text-neutral-500">+234</span>
        </div>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="080 1234 5678"
          maxLength={11}
          className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  DATA BUNDLES TAB  — fintech purchase flow (network → plan)
// ═══════════════════════════════════════════════════════════
interface DataProps extends BaseProps {
  network:         Network | "";
  onNetworkChange: (n: Network) => void;
  phone:           string;
  setPhone:        (v: string) => void;
  onRetry:         () => void;
}

// Pull a clean "10GB" / "1.5GB" token out of a plan name; fall back to the
// name itself (minus the network prefix) for plans that don't follow that
// pattern (e.g. talk-time bundles, data-share plans).
function planSizeLabel(name: string) {
  const match = name.match(/(\d+(?:\.\d+)?\s*(?:GB|MB))/i);
  if (match) return match[0].replace(/\s+/g, "").toUpperCase();
  return name.replace(/^(MTN|AIRTEL|GLO|9mobile)\s*/i, "").trim();
}

export function DataTab({
  network, onNetworkChange, phone, setPhone,
  plans, planLoad, planError,
  plan, setPlan, onRetry,
}: DataProps) {
  const [typeFilter,   setTypeFilter]   = useState<string>("all");
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [search,       setSearch]       = useState("");

  const brand = network ? NET_BRAND[network as Network] : null;

  const availableTypes = useMemo(() => {
    const types = new Set(plans.map((p) => p.planType ?? "gifting"));
    return PLAN_TYPE_TABS.filter((t) => t.id === "all" || types.has(t.id));
  }, [plans]);

  const filtered = useMemo(() => {
    let list = plans;
    if (typeFilter !== "all") list = list.filter((p) => (p.planType ?? "gifting") === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.validity ?? "").toLowerCase().includes(q));
    }
    return list;
  }, [plans, typeFilter, search]);

  const handleNetworkChange = (n: Network) => {
    setTypeFilter("all");
    setSearch("");
    setSearchOpen(false);
    onNetworkChange(n);
  };

  return (
    <div className="space-y-3">

      {/* ── Step 1 — Select Network ── */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: "var(--color-brand-primary, #d98c2a)" }}
          >
            1
          </span>
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Select Network</p>
        </div>
        <NetworkSelector value={network} onChange={handleNetworkChange} />
      </div>

      {network && (
        <>
          {/* ── Phone number ── */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-3.5 sm:p-4 shadow-sm">
            <PhoneInput value={phone} onChange={setPhone} accentColor={brand?.color} />
          </div>

          {/* ── Step 2 — Select Plan ── */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: brand?.color ?? "var(--color-brand-primary, #d98c2a)" }}
                >
                  2
                </span>
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                  Available Plans
                </p>
              </div>

              {!planLoad && !planError && plans.length > 5 && (
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors flex-shrink-0"
                  aria-label="Search plans"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search — tucked away, only opens on demand to keep the page calm */}
            {searchOpen && (
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search size or validity…"
                  className="w-full pl-9 pr-9 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors bg-neutral-50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Plan type filter pills — only shown when there's an actual choice to make */}
            {!planLoad && !planError && availableTypes.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-0.5 px-0.5 [&::-webkit-scrollbar]:hidden">
                {availableTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id)}
                    className={cn(
                      "flex-shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-semibold border transition-all whitespace-nowrap",
                      typeFilter === t.id
                        ? "text-white border-transparent"
                        : "border-neutral-200 text-neutral-500 bg-white"
                    )}
                    style={typeFilter === t.id ? { backgroundColor: brand?.color, borderColor: brand?.color } : {}}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {planLoad && <DataPlanSkeleton />}

            {/* Error */}
            {planError && !planLoad && (
              <div className="text-center py-10">
                <p className="text-sm text-red-400 mb-3">{planError}</p>
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}

            {/* No results after filter/search */}
            {!planLoad && !planError && filtered.length === 0 && plans.length > 0 && (
              <div className="text-center py-10 text-sm text-neutral-400">
                <PackageSearch className="w-7 h-7 mx-auto mb-2 text-neutral-300" />
                No plans match.{" "}
                <button
                  onClick={() => { setTypeFilter("all"); setSearch(""); }}
                  className="underline hover:text-neutral-600"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* ── PLAN GRID — compact cards: size · validity · price · select ── */}
            {!planLoad && !planError && filtered.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {filtered.map((p) => {
                  const isSelected = plan?.id === p.id;
                  const size = planSizeLabel(p.name);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlan(isSelected ? null : p)}
                      className="flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all active:scale-[0.97]"
                      style={{
                        borderColor:     isSelected ? (brand?.color ?? "#d98c2a") : "var(--color-border, #e5e5e5)",
                        backgroundColor: isSelected ? (brand?.bg   ?? "rgba(217,140,42,0.08)") : "var(--color-card-bg, #fff)",
                      }}
                    >
                      <div className="flex items-center justify-between w-full gap-1">
                        <span
                          className="font-bold text-[15px] sm:text-base leading-tight truncate"
                          style={{ color: isSelected ? (brand?.text ?? "#665200") : "#171717" }}
                        >
                          {size}
                        </span>
                        {isSelected && (
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: brand?.color ?? "#d98c2a" }}
                          >
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                          </span>
                        )}
                      </div>
                      {p.validity && (
                        <span className="text-[11px] text-neutral-400 leading-none">{p.validity}</span>
                      )}
                      <span
                        className="text-[13px] font-bold mt-1"
                        style={{ color: brand?.color ?? "#d98c2a" }}
                      >
                        {fmt(p.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  AIRTIME TAB
// ═══════════════════════════════════════════════════════════
interface AirtimeProps extends BaseProps {
  network:         Network | "";
  onNetworkChange: (n: Network) => void;
  phone:           string;
  setPhone:        (v: string) => void;
}

export function AirtimeTab({
  network, onNetworkChange, phone, setPhone,
  plans, planLoad, plan, setPlan,
}: AirtimeProps) {
  const brand = network ? NET_BRAND[network as Network] : null;

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-neutral-100 p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style={{ backgroundColor: "var(--color-brand-primary, #d98c2a)" }}
          >
            1
          </span>
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Select Network</p>
        </div>
        <NetworkSelector value={network} onChange={onNetworkChange} />
      </div>

      {network && (
        <>
          <div className="bg-white rounded-2xl border border-neutral-100 p-3.5 sm:p-4 shadow-sm">
            <PhoneInput value={phone} onChange={setPhone} accentColor={brand?.color} />
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100 p-3.5 sm:p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3">
              <span
                className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ backgroundColor: brand?.color ?? "var(--color-brand-primary, #d98c2a)" }}
              >
                2
              </span>
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">Select Amount</p>
            </div>
            {planLoad ? (
              <div className="grid grid-cols-3 gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-neutral-100 animate-pulse rounded-xl h-12" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {plans.map((p) => {
                  const selected = plan?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlan(selected ? null : p)}
                      className="py-3 rounded-xl text-center border font-bold text-sm transition-all active:scale-[0.97]"
                      style={{
                        borderColor:     selected ? (brand?.color ?? "#d98c2a") : "var(--color-border, #e5e5e5)",
                        backgroundColor: selected ? (brand?.bg   ?? "rgba(217,140,42,0.08)") : "var(--color-card-bg, #fff)",
                        color:           selected ? (brand?.text ?? "#d98c2a") : "#404040",
                      }}
                    >
                      {fmt(p.price)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  CABLE TV TAB
// ═══════════════════════════════════════════════════════════
interface CableProps extends BaseProps {
  cableProv:    string;
  setCableProv: (v: string) => void;
  smartcard:    string;
  setSmartcard: (v: string) => void;
}

const CABLE_META: Record<string, { label: string; color: string; bg: string; gradient: string }> = {
  dstv:      { label: "DStv",      color: "#003087", bg: "#EEF2FF", gradient: "linear-gradient(135deg,#003087,#1a5cbc)" },
  gotv:      { label: "GOtv",      color: "#FF6B00", bg: "#FFF4EE", gradient: "linear-gradient(135deg,#FF6B00,#cc5500)" },
  startimes: { label: "StarTimes", color: "#C8102E", bg: "#FFF0F2", gradient: "linear-gradient(135deg,#C8102E,#9a0a22)" },
};

export function CableTab({
  cableProv, setCableProv, smartcard, setSmartcard,
  plans, planLoad, plan, setPlan,
}: CableProps) {
  const meta = CABLE_META[cableProv];

  return (
    <div className="space-y-2.5">
      <div className="bg-white rounded-2xl border border-neutral-100 p-3 shadow-sm">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
          Cable Provider
        </p>
        <div className="grid grid-cols-3 gap-2">
          {CABLE_PROVIDERS.map((p) => {
            const m        = CABLE_META[p];
            const selected = cableProv === p;
            return (
              <button
                key={p}
                onClick={() => { setCableProv(p); setPlan(null); }}
                className="py-3 rounded-xl border-2 text-xs font-black transition-all"
                style={{
                  borderColor:     selected ? m.color : "#ebebeb",
                  backgroundColor: selected ? m.bg    : "#fafafa",
                  color:           selected ? m.color : "#525252",
                  boxShadow:       selected ? `0 0 0 2px ${m.color}25` : "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider gradient banner */}
      <div
        className="rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm"
        style={{ background: meta.gradient }}
      >
        <div>
          <p className="font-extrabold text-white text-sm">{meta.label} Subscription</p>
          <p className="text-white/70 text-[10px] mt-0.5">Enter your smartcard to continue</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-3 shadow-sm">
        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
          Smartcard / IUC Number
        </label>
        <input
          type="text"
          value={smartcard}
          onChange={(e) => setSmartcard(e.target.value)}
          placeholder="Enter smartcard number"
          className="w-full border-2 border-neutral-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-colors"
          style={{ borderColor: smartcard ? (meta?.color ?? "#d98c2a") : "#e5e5e5" }}
        />
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-3 shadow-sm">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
          Select Plan
        </p>
        {planLoad ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-neutral-100 animate-pulse rounded-xl h-12" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5 scrollbar-thin">
            {plans
              .filter((p) => p.provider === cableProv)
              .map((p) => {
                const selected = plan?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlan(selected ? null : p)}
                    className="w-full px-3 py-2.5 rounded-xl text-left border-2 flex justify-between items-center gap-2 transition-all"
                    style={{
                      borderColor:     selected ? (meta?.color ?? "#d98c2a") : "#ebebeb",
                      backgroundColor: selected ? (meta?.bg   ?? "rgba(217,140,42,0.08)") : "#fafafa",
                      boxShadow:       selected ? `0 0 0 2px ${meta?.color ?? "#d98c2a"}20` : "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <span className="text-xs font-semibold text-neutral-800 leading-snug">{p.name}</span>
                    <span
                      className="text-xs font-black flex-shrink-0"
                      style={{ color: meta?.color ?? "#d98c2a" }}
                    >
                      {fmt(p.price)}
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  EDUCATION / EXAM PINs TAB
// ═══════════════════════════════════════════════════════════
export function EducationTab({ plans, planLoad, plan, setPlan }: BaseProps) {
  const EXAM_META: Record<string, { color: string; bg: string; gradient: string }> = {
    WAEC:   { color: "#1d4ed8", bg: "#dbeafe", gradient: "linear-gradient(135deg,#1d4ed8,#1e40af)" },
    NECO:   { color: "#059669", bg: "#d1fae5", gradient: "linear-gradient(135deg,#059669,#047857)" },
    NABTEB: { color: "#7c3aed", bg: "#ede9fe", gradient: "linear-gradient(135deg,#7c3aed,#6d28d9)" },
  };

  return (
    <div className="space-y-2.5">
      <div
        className="rounded-xl px-4 py-3 shadow-sm"
        style={{ background: "linear-gradient(135deg,#1e3a8a,#1e40af)" }}
      >
        <p className="font-extrabold text-white text-sm">Exam Result Checker</p>
        <p className="text-white/70 text-xs mt-0.5">
          Purchase a scratch card PIN to check your exam results instantly.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 p-3 shadow-sm">
        {planLoad ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-neutral-100 animate-pulse rounded-xl h-14" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((p) => {
              const selected = plan?.id === p.id;
              const meta     = EXAM_META[p.examName ?? ""] ?? { color: "#d98c2a", bg: "#fff7ed", gradient: "linear-gradient(135deg,#d98c2a,#b87020)" };
              return (
                <button
                  key={p.id}
                  onClick={() => setPlan(selected ? null : p)}
                  className="w-full p-3 rounded-xl text-left border-2 flex items-center justify-between gap-3 transition-all"
                  style={{
                    borderColor:     selected ? meta.color : "#ebebeb",
                    backgroundColor: selected ? meta.bg    : "#fafafa",
                    boxShadow:       selected ? `0 0 0 2px ${meta.color}20` : "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[10px] flex-shrink-0"
                      style={{ background: meta.gradient }}
                    >
                      {(p.examName ?? "").slice(0, 3)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-900 text-xs leading-snug truncate">{p.name}</p>
                      <p className="text-[10px] text-neutral-400">1 scratch card PIN</p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-black flex-shrink-0"
                    style={{ color: meta.color }}
                  >
                    {fmt(p.price)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
