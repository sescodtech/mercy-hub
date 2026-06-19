"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Search, CheckCircle2, X } from "lucide-react";
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

const PLAN_TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  sme:       { label: "SME",       color: "#1d4ed8", bg: "#dbeafe" },
  sme2:      { label: "SME 2.0",   color: "#7c3aed", bg: "#ede9fe" },
  corporate: { label: "Corp",      color: "#0f766e", bg: "#ccfbf1" },
  gifting:   { label: "Gift",      color: "#b45309", bg: "#fef3c7" },
  special:   { label: "Special",   color: "#dc2626", bg: "#fee2e2" },
  awoof:     { label: "Awoof",     color: "#d97706", bg: "#fff7ed" },
  datashare: { label: "Share",     color: "#0369a1", bg: "#e0f2fe" },
  talkmore:  { label: "Talk+",     color: "#7c3aed", bg: "#f3e8ff" },
};

// ═══════════════════════════════════════════════════════════
//  SKELETON LOADER
// ═══════════════════════════════════════════════════════════
function DataPlanSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
      <div className="h-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-neutral-100 animate-pulse h-[180px] sm:h-[200px]" />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  NETWORK SELECTOR  — OPay/PalmPay circle logo style
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
            className="relative flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition-all"
            style={{
              borderColor:     selected ? brand.color  : "#e5e5e5",
              backgroundColor: selected ? brand.bg     : "#fafafa",
              boxShadow:       selected ? `0 0 0 3px ${brand.ring}28` : "none",
            }}
          >
            <div
              className="relative rounded-full transition-all"
              style={{
                boxShadow: selected ? `0 0 0 3px ${brand.color}, 0 0 0 5px ${brand.color}30` : "none",
              }}
            >
              <Logo size={32} />
            </div>
            <span
              className="text-[10px] font-bold"
              style={{ color: selected ? brand.text : "#737373" }}
            >
              {label}
            </span>
            {selected && (
              <span
                className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: brand.color }}
              >
                <CheckCircle2 className="w-2 h-2 text-white" strokeWidth={3} />
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
//  DATA BUNDLES TAB  — compact, responsive
// ═══════════════════════════════════════════════════════════
interface DataProps extends BaseProps {
  network:         Network | "";
  onNetworkChange: (n: Network) => void;
  phone:           string;
  setPhone:        (v: string) => void;
  onRetry:         () => void;
}

export function DataTab({
  network, onNetworkChange, phone, setPhone,
  plans, planLoad, planError,
  plan, setPlan, onRetry,
}: DataProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search,     setSearch]     = useState("");

  const brand = network ? NET_BRAND[network as Network] : null;
  const Logo  = network ? NET_LOGO[network as Network]  : null;

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
    onNetworkChange(n);
  };

  return (
    <div className="space-y-2.5">

      {/* ── Network Selector Card ── */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-4 sm:p-5 shadow-sm">
        <p className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3">
          Select Network
        </p>
        <NetworkSelector value={network} onChange={handleNetworkChange} />
      </div>

      {network && (
        <>
          {/* ── Network hero banner — compact ── */}
          <div
            className="rounded-xl px-5 sm:px-6 py-4 sm:py-5 flex items-center gap-4 sm:gap-5 shadow-sm"
            style={{ background: brand?.gradient }}
          >
            {Logo && (
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 shadow">
                <Logo size={32} />
              </div>
            )}
            <div>
              <p className="font-extrabold text-white text-base sm:text-lg leading-tight">
                {network === "9mobile" ? "9mobile" : network.toUpperCase()} Data Plans
              </p>
              <p className="text-white/75 text-sm sm:text-base mt-1">
                {plans.length > 0 ? `${plans.length} plans available` : "Loading plans…"}
              </p>
            </div>
          </div>

          {/* ── Phone Input Card ── */}
          <div className="bg-white rounded-xl border border-neutral-100 p-4 sm:p-5 shadow-sm">
            <PhoneInput value={phone} onChange={setPhone} accentColor={brand?.color} />
          </div>

          {/* ── Plan Selector Card ── */}
          <div className="bg-white rounded-xl border border-neutral-100 p-3 shadow-sm">

            {/* Plan type filter pills */}
            {!planLoad && !planError && plans.length > 0 && availableTypes.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-3 [&::-webkit-scrollbar]:hidden">
                {availableTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id)}
                    className={cn(
                      "flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-[11px] font-bold border transition-all whitespace-nowrap",
                      typeFilter === t.id
                        ? "text-white border-transparent"
                        : "border-neutral-200 text-neutral-500 bg-white hover:border-neutral-300"
                    )}
                    style={typeFilter === t.id
                      ? { backgroundColor: brand?.color, borderColor: brand?.color }
                      : {}}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            {!planLoad && !planError && plans.length > 5 && (
              <div className="relative mb-3 sm:mb-4">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search size or validity…"
                  className="w-full pl-10 sm:pl-12 pr-4 sm:pr-5 py-2 sm:py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors bg-neutral-50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Loading */}
            {planLoad && <DataPlanSkeleton />}

            {/* Error */}
            {planError && !planLoad && (
              <div className="text-center py-8 sm:py-10">
                <p className="text-sm sm:text-base text-red-400 mb-3 sm:mb-4">{planError}</p>
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 sm:gap-2.5 text-sm sm:text-base font-semibold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}

            {/* No match after filter */}
            {!planLoad && !planError && filtered.length === 0 && plans.length > 0 && (
              <div className="text-center py-8 sm:py-10 text-xs sm:text-sm text-neutral-400">
                No plans match.{" "}
                <button
                  onClick={() => { setTypeFilter("all"); setSearch(""); }}
                  className="underline hover:text-neutral-600"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* ── PLAN GRID — fully responsive cards ── */}
            {!planLoad && !planError && filtered.length > 0 && (
              <>
                <p className="text-[10px] sm:text-[11px] text-neutral-400 mb-3 sm:mb-4 font-medium">
                  {filtered.length} plan{filtered.length !== 1 ? "s" : ""}
                </p>
                <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
                  <div className="h-full">
                    {filtered.map((p) => {
                      const isSelected = plan?.id === p.id;
                      const typeMeta   = PLAN_TYPE_BADGE[p.planType ?? "gifting"];

                      // Extract hero data size — prefer a clean "XGB/XMB" token;
                      // fall back to the plan name minus leading network prefix.
                      // Break-words + clamping ensure long fallback names never overflow.
                      const sizeMatch = p.name.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|GB\/|MB\/))/i);
                      const displaySize = sizeMatch
                        ? sizeMatch[0].replace(/\s+/g, "").toUpperCase()
                        : p.name.replace(/^(MTN|AIRTEL|GLO|9mobile)\s*/i, "");

                      // True GB/MB labels are short; long fallback names need smaller text.
                      const isSizeToken = !!sizeMatch;

                      return (
                        <div key={p.id} className="relative">
                          <button
                            onClick={() => setPlan(isSelected ? null : p)}
                            className="relative flex flex-col h-full p-4 sm:p-5 rounded-xl border-2 text-left transition-all active:scale-[0.96] overflow-hidden"
                            style={{
                              borderColor:     isSelected ? (brand?.color ?? "#d98c2a") : "#ebebeb",
                              backgroundColor: isSelected ? (brand?.bg   ?? "rgba(217,140,42,0.08)") : "#fafafa",
                              boxShadow:       isSelected
                                ? `0 0 0 2px ${brand?.ring ?? "#d98c2a"}25, 0 4px 12px ${brand?.ring ?? "#d98c2a"}15`
                                : "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                          >
                            {/* Decorative circle top-right */}
                            <div
                              className="absolute -top-4 sm:-top-5 -right-4 sm:-right-5 w-11 h-11 rounded-full opacity-10 pointer-events-none"
                              style={{ backgroundColor: brand?.color ?? "#d98c2a" }}
                            />

                            {/* Selected tick */}
                            {isSelected && (
                              <span
                                className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 w-4 h-4 rounded-full flex items-center justify-center z-10"
                                style={{ backgroundColor: brand?.color ?? "#d98c2a" }}
                              >
                                <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                              </span>
                            )}

                            {/* Plan type pill */}
                            {typeMeta && (
                              <span
                                className="mb-2 sm:mb-2.5 self-start px-2 sm:px-2.5 py-0.5 sm:py-0.75 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded"
                                style={{ color: typeMeta.color, backgroundColor: typeMeta.bg }}
                              >
                                {typeMeta.label}
                              </span>
                            )}

                            {/* ── Hero data size ── */}
                            <p
                              className={cn(
                                "font-black leading-tight break-words w-full",
                                isSizeToken
                                  ? "text-2xl sm:text-3xl"          // "10GB" — short, large
                                  : "text-xs sm:text-sm line-clamp-2"  // long plan name — smaller + clamped
                              )}
                              style={{ color: isSelected ? (brand?.text ?? "#665200") : "#171717" }}
                            >
                              {displaySize}
                            </p>

                            {/* Validity */}
                            {p.validity && (
                              <p className="text-[9px] sm:text-[10px] text-neutral-400 mt-2 sm:mt-2.5 font-medium leading-tight">{p.validity}</p>
                            )}

                            {/* Price */}
                            <p
                              className="text-sm sm:text-base font-black mt-auto pt-2 sm:pt-2.5"
                              style={{ color: brand?.color ?? "#d98c2a" }}
                            >
                              {fmt(p.price)}
                            </p>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
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
  const Logo  = network ? NET_LOGO[network as Network]  : null;

  return (
    <div className="space-y-2.5">
      <div className="bg-white rounded-2xl border border-neutral-100 p-3 shadow-sm">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
          Select Network
        </p>
        <NetworkSelector value={network} onChange={onNetworkChange} />
      </div>

      {network && (
        <>
          {/* Network hero banner */}
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
            style={{ background: brand?.gradient }}
          >
            {Logo && (
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0 shadow">
                <Logo size={28} />
              </div>
            )}
            <div>
              <p className="font-extrabold text-white text-sm leading-tight">
                {network === "9mobile" ? "9mobile" : network.toUpperCase()} Airtime
              </p>
              <p className="text-white/75 text-[11px] mt-0.5">Instant top-up</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-100 p-3 shadow-sm">
            <PhoneInput value={phone} onChange={setPhone} accentColor={brand?.color} />
          </div>

          <div className="bg-white rounded-xl border border-neutral-100 p-3 shadow-sm">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">
              Select Amount
            </p>
            {planLoad ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-neutral-100 animate-pulse rounded-xl h-12" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {plans.map((p) => {
                  const selected = plan?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlan(selected ? null : p)}
                      className="py-3 rounded-xl text-center border-2 transition-all font-black text-xs sm:text-sm"
                      style={{
                        borderColor:     selected ? (brand?.color ?? "#d98c2a") : "#ebebeb",
                        backgroundColor: selected ? (brand?.bg   ?? "rgba(217,140,42,0.1)") : "#fafafa",
                        color:           selected ? (brand?.text ?? "#d98c2a") : "#404040",
                        boxShadow:       selected ? `0 0 0 2px ${brand?.ring ?? "#d98c2a"}25` : "0 1px 3px rgba(0,0,0,0.04)",
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
