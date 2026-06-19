"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Search, CheckCircle2 } from "lucide-react";
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
//  NETWORK BRAND CONFIG
// ═══════════════════════════════════════════════════════════
const NET_BRAND: Record<Network, {
  color: string; bg: string; border: string; text: string; ring: string;
}> = {
  mtn:     { color: "#FFCC00", bg: "#FFFBE6", border: "#FFE066", text: "#7A5900", ring: "#FFCC00" },
  airtel:  { color: "#EE0000", bg: "#FFF0F0", border: "#FFB3B3", text: "#8B0000", ring: "#EE0000" },
  glo:     { color: "#009A44", bg: "#EDFBF3", border: "#86EFAC", text: "#005C29", ring: "#009A44" },
  "9mobile": { color: "#00A86B", bg: "#ECFDF5", border: "#6EE7B7", text: "#00503A", ring: "#00A86B" },
};

// ═══════════════════════════════════════════════════════════
//  PLAN TYPE FILTER PILLS
// ═══════════════════════════════════════════════════════════
const PLAN_TYPE_TABS = [
  { id: "all",       label: "All Plans"  },
  { id: "sme",       label: "SME"        },
  { id: "sme2",      label: "SME 2.0"    },
  { id: "corporate", label: "Corporate"  },
  { id: "gifting",   label: "Gifting"    },
];

const PLAN_TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  sme:       { label: "SME",       color: "#1d4ed8", bg: "#dbeafe" },
  sme2:      { label: "SME 2.0",   color: "#7c3aed", bg: "#ede9fe" },
  corporate: { label: "Corp",      color: "#0f766e", bg: "#ccfbf1" },
  gifting:   { label: "Gifting",   color: "#b45309", bg: "#fef3c7" },
};

// ═══════════════════════════════════════════════════════════
//  DATA PLAN SKELETON LOADER
// ═══════════════════════════════════════════════════════════
function DataPlanSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl skeleton h-[88px]" />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  NETWORK SELECTOR (shared by Data + Airtime tabs)
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
        const selected = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="relative flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all text-sm font-bold"
            style={{
              borderColor:     selected ? brand.color  : "#e5e5e5",
              backgroundColor: selected ? brand.bg     : "#fafafa",
              color:           selected ? brand.text   : "#737373",
              boxShadow:       selected ? `0 0 0 3px ${brand.ring}30` : "none",
            }}
          >
            {selected && (
              <span
                className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: brand.color }}
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </span>
            )}
            {/* Network colour dot */}
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: brand.color }}
            />
            <span className="text-xs">{label}</span>
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
        className="flex items-center rounded-2xl border-2 overflow-hidden transition-all"
        style={{ borderColor: value ? (accentColor ?? "#d98c2a") : "#e5e5e5" }}
      >
        {/* Nigeria flag prefix */}
        <div className="flex items-center gap-1.5 px-3.5 py-3 border-r border-neutral-200 bg-neutral-50 flex-shrink-0">
          <span className="text-base leading-none">🇳🇬</span>
          <span className="text-xs font-semibold text-neutral-500">+234</span>
        </div>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="080 1234 5678"
          maxLength={11}
          className="flex-1 px-3.5 py-3 text-sm focus:outline-none bg-transparent"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  DATA BUNDLES TAB  ← redesigned
// ═══════════════════════════════════════════════════════════
interface DataProps extends BaseProps {
  network:          Network | "";
  onNetworkChange:  (n: Network) => void;
  phone:            string;
  setPhone:         (v: string) => void;
  onRetry:          () => void;
}

export function DataTab({
  network, onNetworkChange, phone, setPhone,
  plans, planLoad, planError,
  plan, setPlan, onRetry,
}: DataProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search,     setSearch]     = useState("");

  const brand = network ? NET_BRAND[network as Network] : null;

  // Available plan types for the selected network
  const availableTypes = useMemo(() => {
    const types = new Set(plans.map((p) => p.planType ?? "gifting"));
    return PLAN_TYPE_TABS.filter((t) => t.id === "all" || types.has(t.id));
  }, [plans]);

  // Filtered plan list
  const filtered = useMemo(() => {
    let list = plans;
    if (typeFilter !== "all") {
      list = list.filter((p) => (p.planType ?? "gifting") === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.validity ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [plans, typeFilter, search]);

  // Reset filter when network changes (new plan list arrives)
  const handleNetworkChange = (n: Network) => {
    setTypeFilter("all");
    setSearch("");
    onNetworkChange(n);
  };

  return (
    <div className="space-y-4">

      {/* ── Network Selector ── */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          Select Network
        </p>
        <NetworkSelector value={network} onChange={handleNetworkChange} />
      </div>

      {/* ── Phone + Plans (shown after network pick) ── */}
      {network && (
        <>
          {/* Phone input card */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <PhoneInput
              value={phone}
              onChange={setPhone}
              accentColor={brand?.color}
            />
          </div>

          {/* Plans card */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">

            {/* Plan type filter pills */}
            {!planLoad && !planError && plans.length > 0 && availableTypes.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 mb-4 [&::-webkit-scrollbar]:hidden">
                {availableTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id)}
                    className={cn(
                      "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap",
                      typeFilter === t.id
                        ? "text-white border-transparent"
                        : "border-neutral-200 text-neutral-500 bg-white hover:border-neutral-300"
                    )}
                    style={typeFilter === t.id
                      ? { backgroundColor: brand?.color ?? "#d98c2a", borderColor: brand?.color ?? "#d98c2a" }
                      : {}}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            {/* Search input */}
            {!planLoad && !planError && plans.length > 5 && (
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by size or validity…"
                  className="w-full text-sm border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-neutral-400 transition-colors"
                />
              </div>
            )}

            {/* Plan header count */}
            {!planLoad && !planError && filtered.length > 0 && (
              <p className="text-xs text-neutral-400 mb-3">
                {filtered.length} plan{filtered.length !== 1 ? "s" : ""} available
              </p>
            )}

            {/* Loading skeleton */}
            {planLoad && <DataPlanSkeleton />}

            {/* Error state */}
            {planError && !planLoad && (
              <div className="text-center py-8">
                <p className="text-sm text-red-400 mb-3">{planError}</p>
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            )}

            {/* No results (after filter/search) */}
            {!planLoad && !planError && filtered.length === 0 && plans.length > 0 && (
              <div className="text-center py-8 text-sm text-neutral-400">
                No plans match your filter.{" "}
                <button
                  onClick={() => { setTypeFilter("all"); setSearch(""); }}
                  className="underline hover:text-neutral-600"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Plan grid */}
            {!planLoad && !planError && filtered.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-0.5 scrollbar-thin">
                {filtered.map((p) => {
                  const isSelected = plan?.id === p.id;
                  const typeMeta   = PLAN_TYPE_BADGE[p.planType ?? "gifting"];

                  // Extract display size (e.g. "2GB", "500MB") from plan name
                  const sizeMatch = p.name.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|TB))/i);
                  const displaySize = sizeMatch
                    ? sizeMatch[0].replace(/\s+/g, "").toUpperCase()
                    : p.name.replace(/^(MTN|AIRTEL|GLO|9mobile)\s*/i, "");

                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlan(isSelected ? null : p)}
                      className="relative flex flex-col p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[0.97]"
                      style={{
                        borderColor:     isSelected ? (brand?.color ?? "#d98c2a") : "#e5e5e5",
                        backgroundColor: isSelected ? (brand?.bg   ?? "rgba(217,140,42,0.08)") : "#fafafa",
                        boxShadow:       isSelected ? `0 0 0 2px ${brand?.ring ?? "#d98c2a"}30` : "none",
                      }}
                    >
                      {/* Selected tick */}
                      {isSelected && (
                        <span
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: brand?.color ?? "#d98c2a" }}
                        >
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </span>
                      )}

                      {/* Plan type badge */}
                      {typeMeta && (
                        <span
                          className="mb-1.5 self-start px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded"
                          style={{ color: typeMeta.color, backgroundColor: typeMeta.bg }}
                        >
                          {typeMeta.label}
                        </span>
                      )}

                      {/* Data size — hero text */}
                      <p
                        className="text-lg font-extrabold leading-none tracking-tight"
                        style={{ color: isSelected ? (brand?.text ?? "#665200") : "#171717" }}
                      >
                        {displaySize}
                      </p>

                      {/* Validity */}
                      {p.validity && (
                        <p className="text-[10px] text-neutral-400 mt-0.5">{p.validity}</p>
                      )}

                      {/* Price */}
                      <p
                        className="text-sm font-bold mt-2"
                        style={{ color: brand?.color ?? "#d98c2a" }}
                      >
                        {fmt(p.price)}
                      </p>
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
//  AIRTIME TAB  (improved, layout preserved)
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
    <div className="space-y-4">
      {/* Network */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          Select Network
        </p>
        <NetworkSelector value={network} onChange={onNetworkChange} />
      </div>

      {network && (
        <>
          {/* Phone */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <PhoneInput value={phone} onChange={setPhone} accentColor={brand?.color} />
          </div>

          {/* Amounts */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
              Select Amount
            </p>
            {planLoad ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton rounded-xl h-14" />
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
                      className="py-3.5 rounded-xl text-center border-2 transition-all font-bold text-sm"
                      style={{
                        borderColor:     selected ? (brand?.color ?? "#d98c2a") : "#e5e5e5",
                        backgroundColor: selected ? (brand?.bg   ?? "rgba(217,140,42,0.1)") : "#fafafa",
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
//  CABLE TV TAB  (improved layout)
// ═══════════════════════════════════════════════════════════
interface CableProps extends BaseProps {
  cableProv:    string;
  setCableProv: (v: string) => void;
  smartcard:    string;
  setSmartcard: (v: string) => void;
}

const CABLE_META: Record<string, { label: string; color: string; bg: string }> = {
  dstv:      { label: "DStv",      color: "#003087", bg: "#EEF2FF" },
  gotv:      { label: "GOtv",      color: "#FF6B00", bg: "#FFF4EE" },
  startimes: { label: "StarTimes", color: "#C8102E", bg: "#FFF0F2" },
};

export function CableTab({
  cableProv, setCableProv, smartcard, setSmartcard,
  plans, planLoad, plan, setPlan,
}: CableProps) {
  const meta = CABLE_META[cableProv];

  return (
    <div className="space-y-4">
      {/* Provider selector */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
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
                className="py-3.5 rounded-xl border-2 text-sm font-bold transition-all"
                style={{
                  borderColor:     selected ? m.color : "#e5e5e5",
                  backgroundColor: selected ? m.bg    : "#fafafa",
                  color:           selected ? m.color : "#525252",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Smartcard */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5">
        <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
          Smartcard / IUC Number
        </label>
        <input
          type="text"
          value={smartcard}
          onChange={(e) => setSmartcard(e.target.value)}
          placeholder="Enter smartcard number"
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
          style={{ borderColor: smartcard ? (meta?.color ?? "#d98c2a") : "#e5e5e5" }}
        />
      </div>

      {/* Plans */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-5">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          Select Plan
        </p>
        {planLoad ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton rounded-xl h-14" />
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5 scrollbar-thin">
            {plans
              .filter((p) => p.provider === cableProv)
              .map((p) => {
                const selected = plan?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlan(selected ? null : p)}
                    className="w-full p-3.5 rounded-xl text-left border-2 flex justify-between items-center transition-all"
                    style={{
                      borderColor:     selected ? (meta?.color ?? "#d98c2a") : "#e5e5e5",
                      backgroundColor: selected ? (meta?.bg   ?? "rgba(217,140,42,0.08)") : "#fafafa",
                    }}
                  >
                    <span className="text-sm font-medium text-neutral-800">{p.name}</span>
                    <span
                      className="text-sm font-bold flex-shrink-0 ml-3"
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
//  EDUCATION / EXAM PINs TAB  (improved layout)
// ═══════════════════════════════════════════════════════════
export function EducationTab({ plans, planLoad, plan, setPlan }: BaseProps) {
  const EXAM_META: Record<string, { color: string; bg: string }> = {
    WAEC:   { color: "#1d4ed8", bg: "#dbeafe" },
    NECO:   { color: "#059669", bg: "#d1fae5" },
    NABTEB: { color: "#7c3aed", bg: "#ede9fe" },
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <h2 className="font-semibold text-neutral-900 mb-0.5">Exam Result Checker</h2>
      <p className="text-sm text-neutral-400 mb-5">
        Purchase a scratch card PIN to check your exam results.
      </p>

      {planLoad ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton rounded-2xl h-16" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => {
            const selected = plan?.id === p.id;
            const meta     = EXAM_META[p.examName ?? ""] ?? { color: "#d98c2a", bg: "#fff7ed" };
            return (
              <button
                key={p.id}
                onClick={() => setPlan(selected ? null : p)}
                className="w-full p-4 rounded-2xl text-left border-2 flex items-center justify-between transition-all"
                style={{
                  borderColor:     selected ? meta.color : "#e5e5e5",
                  backgroundColor: selected ? meta.bg    : "#fafafa",
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="px-2.5 py-1 text-xs font-bold rounded-lg"
                    style={{ color: meta.color, backgroundColor: `${meta.color}18` }}
                  >
                    {p.examName}
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900 text-sm">{p.name}</p>
                    <p className="text-xs text-neutral-400">1 scratch card PIN</p>
                  </div>
                </div>
                <span className="text-sm font-bold flex-shrink-0 ml-3" style={{ color: meta.color }}>
                  {fmt(p.price)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
