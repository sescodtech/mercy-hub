"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { NETWORKS, CABLE_PROVIDERS, fmt } from "../types";
import type { Network, Plan } from "../types";

interface BaseProps {
  plans: Plan[];
  planLoad: boolean;
  planError?: string;
  plan: Plan | null;
  setPlan: (p: Plan | null) => void;
}

/* ───────────────────────── Data Bundles ───────────────────────── */
interface DataProps extends BaseProps {
  network: Network | "";
  onNetworkChange: (n: Network) => void;
  phone: string;
  setPhone: (v: string) => void;
  onRetry: () => void;
}

export function DataTab({ network, onNetworkChange, phone, setPhone, plans, planLoad, planError, plan, setPlan, onRetry }: DataProps) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <h2 className="font-semibold text-neutral-900 mb-4">Select Network</h2>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {NETWORKS.map((n) => (
          <button
            key={n.id}
            onClick={() => onNetworkChange(n.id)}
            className="py-3 rounded-xl text-sm font-semibold border-2 transition-all"
            style={{
              borderColor: network === n.id ? "#d98c2a" : "#e5e5e5",
              backgroundColor: network === n.id ? "rgba(217,140,42,0.1)" : "transparent",
              color: network === n.id ? "#d98c2a" : "#525252",
            }}
          >
            {n.label}
          </button>
        ))}
      </div>

      {network && (
        <>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
            maxLength={11}
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none mb-5"
            style={{ borderColor: phone ? "#d98c2a" : "#e5e5e5" }}
          />

          <h3 className="font-medium text-neutral-700 mb-3 text-sm">Select Bundle</h3>

          {planLoad && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#d98c2a" }} />
            </div>
          )}

          {planError && !planLoad && (
            <div className="text-center py-6">
              <p className="text-sm text-red-500 mb-3">{planError}</p>
              <button onClick={onRetry} className="text-sm flex items-center gap-1 mx-auto" style={{ color: "#d98c2a" }}>
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {!planLoad && !planError && plans.length > 0 && (
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p)}
                  className="p-3 rounded-xl text-left border-2 transition-all"
                  style={{
                    borderColor: plan?.id === p.id ? "#d98c2a" : "#e5e5e5",
                    backgroundColor: plan?.id === p.id ? "rgba(217,140,42,0.08)" : "transparent",
                  }}
                >
                  <p className="font-semibold text-sm text-neutral-900">
                    {p.name.replace(/^(MTN|AIRTEL|GLO|9mobile)\s*/i, "")}
                  </p>
                  {p.validity && <p className="text-xs text-neutral-400">{p.validity}</p>}
                  <p className="text-sm font-bold mt-1" style={{ color: "#d98c2a" }}>{fmt(p.price)}</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Airtime ───────────────────────── */
interface AirtimeProps extends BaseProps {
  network: Network | "";
  onNetworkChange: (n: Network) => void;
  phone: string;
  setPhone: (v: string) => void;
}

export function AirtimeTab({ network, onNetworkChange, phone, setPhone, plans, planLoad, plan, setPlan }: AirtimeProps) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <h2 className="font-semibold text-neutral-900 mb-4">Buy Airtime</h2>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {NETWORKS.map((n) => (
          <button
            key={n.id}
            onClick={() => onNetworkChange(n.id)}
            className="py-3 rounded-xl text-sm font-semibold border-2 transition-all"
            style={{
              borderColor: network === n.id ? "#d98c2a" : "#e5e5e5",
              backgroundColor: network === n.id ? "rgba(217,140,42,0.1)" : "transparent",
              color: network === n.id ? "#d98c2a" : "#525252",
            }}
          >
            {n.label}
          </button>
        ))}
      </div>

      {network && (
        <>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
            maxLength={11}
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none mb-5"
            style={{ borderColor: phone ? "#d98c2a" : "#e5e5e5" }}
          />

          <h3 className="font-medium text-neutral-700 mb-3 text-sm">Select Amount</h3>
          {planLoad ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#d98c2a" }} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p)}
                  className="py-3 rounded-xl text-center border-2 transition-all"
                  style={{
                    borderColor: plan?.id === p.id ? "#d98c2a" : "#e5e5e5",
                    backgroundColor: plan?.id === p.id ? "rgba(217,140,42,0.1)" : "transparent",
                  }}
                >
                  <p className="font-bold text-sm" style={{ color: "#d98c2a" }}>{fmt(p.price)}</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Cable TV ───────────────────────── */
interface CableProps extends BaseProps {
  cableProv: string;
  setCableProv: (v: string) => void;
  smartcard: string;
  setSmartcard: (v: string) => void;
}

export function CableTab({ cableProv, setCableProv, smartcard, setSmartcard, plans, planLoad, plan, setPlan }: CableProps) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <h2 className="font-semibold text-neutral-900 mb-4">Cable TV Subscription</h2>

      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Provider</label>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {CABLE_PROVIDERS.map((p) => (
          <button
            key={p}
            onClick={() => { setCableProv(p); setPlan(null); }}
            className="py-3 rounded-xl text-sm font-semibold border-2 capitalize transition-all"
            style={{
              borderColor: cableProv === p ? "#d98c2a" : "#e5e5e5",
              backgroundColor: cableProv === p ? "rgba(217,140,42,0.1)" : "transparent",
              color: cableProv === p ? "#d98c2a" : "#525252",
            }}
          >
            {p === "startimes" ? "StarTimes" : p.toUpperCase()}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Smartcard / IUC Number</label>
      <input
        type="text"
        value={smartcard}
        onChange={(e) => setSmartcard(e.target.value)}
        placeholder="Enter smartcard number"
        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none mb-4"
      />

      <h3 className="font-medium text-neutral-700 mb-3 text-sm">Select Plan</h3>
      {planLoad ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#d98c2a" }} />
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {plans.filter((p) => p.provider === cableProv).map((p) => (
            <button
              key={p.id}
              onClick={() => setPlan(p)}
              className="w-full p-3 rounded-xl text-left border-2 flex justify-between items-center transition-all"
              style={{
                borderColor: plan?.id === p.id ? "#d98c2a" : "#e5e5e5",
                backgroundColor: plan?.id === p.id ? "rgba(217,140,42,0.08)" : "transparent",
              }}
            >
              <span className="text-sm font-medium text-neutral-800">{p.name}</span>
              <span className="text-sm font-bold" style={{ color: "#d98c2a" }}>{fmt(p.price)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Education / Exam PINs ───────────────────────── */
export function EducationTab({ plans, planLoad, plan, setPlan }: BaseProps) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <h2 className="font-semibold text-neutral-900 mb-2">Exam Result Checker</h2>
      <p className="text-sm text-neutral-500 mb-4">Purchase a scratch card PIN to check your exam results.</p>

      {planLoad ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#d98c2a" }} />
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlan(p)}
              className="w-full p-4 rounded-xl text-left border-2 flex justify-between items-center transition-all"
              style={{
                borderColor: plan?.id === p.id ? "#d98c2a" : "#e5e5e5",
                backgroundColor: plan?.id === p.id ? "rgba(217,140,42,0.08)" : "transparent",
              }}
            >
              <div>
                <p className="font-semibold text-neutral-900 text-sm">{p.name}</p>
                <p className="text-xs text-neutral-400">1 scratch card</p>
              </div>
              <span className="text-sm font-bold" style={{ color: "#d98c2a" }}>{fmt(p.price)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
