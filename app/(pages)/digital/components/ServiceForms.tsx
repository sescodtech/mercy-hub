"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { RefreshCw, Search, X, PackageSearch, ChevronDown, Sparkles } from "lucide-react";
import { NETWORKS, CABLE_PROVIDERS, fmt, detectNetwork } from "../types";
import type { Network, Plan, Promo } from "../types";
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
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-neutral-100 animate-pulse h-[64px]" />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  NETWORK PICKER  — OPay-style compact row: [logo ▾] | number
// ═══════════════════════════════════════════════════════════
function NetworkPicker({
  value, onChange,
}: {
  value: Network | "";
  onChange: (n: Network) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const brand = value ? NET_BRAND[value] : null;
  const Logo  = value ? NET_LOGO[value]  : null;

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 pr-1.5 py-1 rounded-lg"
        aria-label="Choose network"
      >
        {Logo ? <Logo size={26} /> : (
          <span className="w-[26px] h-[26px] rounded-full bg-neutral-200 flex items-center justify-center">
            <Search className="w-3 h-3 text-neutral-400" />
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-30 rounded-xl border shadow-lg p-2 grid grid-cols-4 gap-1.5 w-[220px]"
          style={{ backgroundColor: "var(--color-card-bg, #fff)", borderColor: "var(--color-border, #e5e5e5)" }}
        >
          {NETWORKS.map(({ id, label }) => {
            const b = NET_BRAND[id];
            const L = NET_LOGO[id];
            const selected = value === id;
            return (
              <button
                key={id}
                onClick={() => { onChange(id); setOpen(false); }}
                className="flex flex-col items-center gap-1 py-1.5 rounded-lg"
                style={{ backgroundColor: selected ? b.bg : "transparent" }}
              >
                <L size={24} />
                <span className="text-[9px] font-semibold" style={{ color: selected ? b.text : "#737373" }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  PHONE ROW — OPay-style: [Network ▾] | phone number
//  Detects the network from the digits as the user types and
//  reports it upward; manual picks always take precedence and
//  are never overridden by a later detection.
// ═══════════════════════════════════════════════════════════
function PhoneRow({
  value, onChange, network, onNetworkChange, onNetworkDetected,
}: {
  value: string;
  onChange: (v: string) => void;
  network: Network | "";
  onNetworkChange: (n: Network) => void;
  onNetworkDetected?: (n: Network) => void;
}) {
  const manualPick = useRef(false);

  return (
    <div
      className="flex items-center gap-2 rounded-xl border px-2.5 py-2"
      style={{ backgroundColor: "var(--color-card-bg, #fff)", borderColor: "var(--color-border, #e5e5e5)" }}
    >
      <NetworkPicker
        value={network}
        onChange={(n) => { manualPick.current = true; onNetworkChange(n); }}
      />
      <span className="w-px h-5 bg-neutral-200 flex-shrink-0" />
      <input
        type="tel"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v);
          if (!manualPick.current) {
            const detected = detectNetwork(v);
            if (detected) onNetworkDetected?.(detected);
          }
        }}
        placeholder="081 3631 7465"
        maxLength={11}
        className="flex-1 min-w-0 text-[15px] font-medium focus:outline-none bg-transparent"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  NETWORK PROMO STRIP — compact "HOT DEALS" row scoped to the
//  currently selected network, shown inside the Data tab. Fetches
//  its own promos (not via PromoGrid) so it can decide whether to
//  render the label at all — no header sitting above an empty grid.
// ═══════════════════════════════════════════════════════════
function NetworkPromoStrip({
  network, onSelect,
}: {
  network: Network;
  onSelect: (promo: Promo) => void;
}) {
  const [promos, setPromos] = useState<Promo[] | null>(null); // null = still loading

  useEffect(() => {
    let alive = true;
    setPromos(null);
    fetch(`/api/digital/promos?type=deal&network=${network}`)
      .then((r) => r.json())
      .then((d: { success: boolean; data?: Promo[] }) => {
        if (!alive) return;
        setPromos(d.success ? (d.data ?? []).slice(0, 3) : []);
      })
      .catch(() => { if (alive) setPromos([]); });
    return () => { alive = false; };
  }, [network]);

  if (!promos || promos.length === 0) return null; // loading or none — render nothing, no empty label

  return (
    <div className="min-w-0 max-w-full">
      <div className="flex items-center gap-1 mb-1.5">
        <Sparkles className="w-3 h-3" style={{ color: "#ef4444" }} />
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Hot Deals</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {promos.map((p) => (
          <button
            key={p._id}
            onClick={() => onSelect(p)}
            className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg border text-center transition-all active:scale-[0.96] min-w-0 max-w-full overflow-hidden h-[64px]"
            style={{ borderColor: "#fecaca", backgroundColor: "#fff5f5" }}
          >
            <span
              className="block w-full font-bold text-[10.5px] leading-[1.1] text-neutral-900"
              style={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {p.title}
            </span>
            <span className="text-[10px] font-bold leading-tight" style={{ color: "#ef4444" }}>
              {p.badge ?? "Hot"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  DATA BUNDLES TAB  — compact OPay-density layout
// ═══════════════════════════════════════════════════════════
interface DataProps extends BaseProps {
  network:         Network | "";
  onNetworkChange: (n: Network) => void;
  phone:           string;
  setPhone:        (v: string) => void;
  onRetry:         () => void;
  /** Fired the instant a plan is tapped — lets the parent jump straight
   *  to phone confirmation + payment instead of staying on this list. */
  onPlanSelect?:   (p: Plan) => void;
  /** Fired when a network-scoped Hot Deal/Promo card is tapped inside this
   *  tab — routes through the same direct-purchase flow as the Deals/Promos
   *  tabs, just without leaving the Data tab or losing the network. */
  onSelectPromo?:  (promo: Promo) => void;
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
  plan, setPlan, onRetry, onPlanSelect, onSelectPromo,
}: DataProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search,     setSearch]     = useState("");

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
    onNetworkChange(n);
  };

  const pickPlan = (p: Plan) => {
    setPlan(p);
    onPlanSelect?.(p);
  };

  return (
    <div className="space-y-2 min-w-0 max-w-full overflow-x-hidden">

      {/* ── Phone row: network picker + number, one compact line ── */}
      <PhoneRow
        value={phone}
        onChange={setPhone}
        network={network}
        onNetworkChange={handleNetworkChange}
        onNetworkDetected={handleNetworkChange}
      />

      {/* ── Network-scoped Hot Deals — only this network's own promos.
           Compact strip, not a banner; tapping a card routes straight into
           the same direct-purchase flow as the dedicated Deals/Promos tabs.
           Renders nothing if this network has no active promos (the wrapper
           below stays invisible too — no empty label sitting above nothing). ── */}
      {network && onSelectPromo && (
        <NetworkPromoStrip network={network} onSelect={onSelectPromo} />
      )}

      {network && (
        <>
          {/* Category pills — small, horizontal, OPay-style.
              MTN is the only network whose provider data has more than one
              plan type (SME/SME2/Corporate/Awoof/Talk More/Data Share, vs.
              everyone else falling back to plain "gifting") — so this row
              only ever renders for MTN. min-w-0 + max-w-full on the
              scroll container itself (not just its children) is required
              here: iOS Safari can still let a flex row's natural content
              width leak into a Grid/Flex ancestor's layout otherwise,
              which is what was forcing the whole page to scroll sideways
              the moment MTN was selected. */}
          {!planLoad && !planError && availableTypes.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 min-w-0 max-w-full [&::-webkit-scrollbar]:hidden">
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

          {/* Search — only when there's enough plans to need it */}
          {!planLoad && !planError && plans.length > 8 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search size or validity…"
                className="w-full pl-8 pr-8 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors bg-neutral-50"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {planLoad && <DataPlanSkeleton />}

          {/* Error */}
          {planError && !planLoad && (
            <div className="text-center py-8">
              <p className="text-xs text-red-400 mb-2.5">{planError}</p>
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* No results after filter/search */}
          {!planLoad && !planError && filtered.length === 0 && plans.length > 0 && (
            <div className="text-center py-8 text-xs text-neutral-400">
              <PackageSearch className="w-6 h-6 mx-auto mb-1.5 text-neutral-300" />
              No plans match.{" "}
              <button onClick={() => { setTypeFilter("all"); setSearch(""); }} className="underline hover:text-neutral-600">
                Clear filter
              </button>
            </div>
          )}

          {/* ── PLAN GRID — always 3 columns, compact cards.
               Long MTN labels (TALKMOREN400FOR7DAYS, 50030DAYSMB, etc.)
               now WRAP onto 2 lines instead of truncating/clipping — a
               fixed card height keeps every card the same size whether
               the label is short ("1GB") or long, so the grid never loses
               its 3rd column the way truncate + break-all combo did. ── */}
          {!planLoad && !planError && filtered.length > 0 && (
            <div className="grid grid-cols-3 gap-1.5 [&>*]:min-w-0">
              {filtered.map((p) => {
                const isSelected = plan?.id === p.id;
                const size = planSizeLabel(p.name);
                return (
                  <button
                    key={p.id}
                    onClick={() => pickPlan(p)}
                    className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-lg border text-center transition-all active:scale-[0.96] min-w-0 max-w-full overflow-hidden h-[64px]"
                    style={{
                      borderColor:     isSelected ? (brand?.color ?? "#d98c2a") : "var(--color-border, #e5e5e5)",
                      backgroundColor: isSelected ? (brand?.bg   ?? "rgba(217,140,42,0.08)") : "var(--color-card-bg, #fff)",
                    }}
                  >
                    <span
                      className="block w-full font-bold text-[10.5px] leading-[1.1]"
                      style={{
                        color: isSelected ? (brand?.text ?? "#665200") : "#171717",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {size}
                    </span>
                    {p.validity && (
                      <span className="block max-w-full text-[8.5px] text-neutral-400 leading-none truncate">{p.validity}</span>
                    )}
                    <span
                      className="text-[10px] font-bold leading-tight"
                      style={{ color: brand?.color ?? "#d98c2a" }}
                    >
                      {fmt(p.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
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
  onPlanSelect?:   (p: Plan) => void;
}

export function AirtimeTab({
  network, onNetworkChange, phone, setPhone,
  plans, planLoad, plan, setPlan, onPlanSelect,
}: AirtimeProps) {
  const brand = network ? NET_BRAND[network as Network] : null;

  const pickPlan = (p: Plan) => {
    setPlan(p);
    onPlanSelect?.(p);
  };

  return (
    <div className="space-y-2">
      <PhoneRow
        value={phone}
        onChange={setPhone}
        network={network}
        onNetworkChange={onNetworkChange}
        onNetworkDetected={onNetworkChange}
      />

      {network && (
        <div className="grid grid-cols-3 gap-1.5">
          {planLoad ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-neutral-100 animate-pulse rounded-lg h-12" />
            ))
          ) : (
            plans.map((p) => {
              const selected = plan?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => pickPlan(p)}
                  className="py-2.5 rounded-lg text-center border font-bold text-[13px] transition-all active:scale-[0.96]"
                  style={{
                    borderColor:     selected ? (brand?.color ?? "#d98c2a") : "var(--color-border, #e5e5e5)",
                    backgroundColor: selected ? (brand?.bg   ?? "rgba(217,140,42,0.08)") : "var(--color-card-bg, #fff)",
                    color:           selected ? (brand?.text ?? "#d98c2a") : "#404040",
                  }}
                >
                  {fmt(p.price)}
                </button>
              );
            })
          )}
        </div>
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
