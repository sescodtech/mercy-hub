"use client";

import Link from "next/link";
import { Wallet, ShieldCheck, Loader2, X } from "lucide-react";
import { fmt } from "../types";
import type { Plan, PayMethod } from "../types";

interface Props {
  plan: Plan;
  payMethod: PayMethod;
  setPayMethod: (m: PayMethod) => void;
  walletBal: number;
  loading: boolean;
  canPurchase: boolean;
  onPurchase: () => void;
  /** Phone number being topped up / recharged — shown for quick confirmation
   *  before payment, so the user doesn't have to scroll back up to check it. */
  phone?: string;
  /** Renders a close (×) button — used when this panel is shown inside the
   *  mobile bottom sheet, where the user can dismiss without purchasing. */
  onClose?: () => void;
}

export function OrderSummaryPanel({
  plan, payMethod, setPayMethod, walletBal, loading, canPurchase, onPurchase, phone, onClose,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      {onClose && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-neutral-900 text-sm">Confirm Purchase</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected plan + phone — visible at a glance, no scrolling needed.
          min-w-0 + truncate on the value side stops long, space-less plan
          names (seen mostly on MTN, e.g. "TALKMOREN400FOR7DAYS") from
          forcing this row — and the fixed-width sheet/panel around it —
          wider than the viewport. */}
      <div className="rounded-xl bg-neutral-50 p-3 mb-4 space-y-1.5">
        <div className="flex justify-between gap-2 text-sm">
          <span className="text-neutral-500 flex-shrink-0">Plan</span>
          <span className="font-semibold text-neutral-900 text-right truncate min-w-0">{plan.name}</span>
        </div>
        {phone && (
          <div className="flex justify-between gap-2 text-sm">
            <span className="text-neutral-500 flex-shrink-0">Phone</span>
            <span className="font-semibold text-neutral-900 font-mono truncate min-w-0">{phone}</span>
          </div>
        )}
        <div className="flex justify-between text-sm pt-1.5 border-t border-neutral-200">
          <span className="text-neutral-500">Amount</span>
          <span className="font-bold" style={{ color: "#d98c2a" }}>{fmt(plan.price)}</span>
        </div>
      </div>

      <h3 className="font-medium text-neutral-700 mb-2 text-xs uppercase tracking-wide">Payment Method</h3>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <button
          onClick={() => setPayMethod("wallet")}
          className="p-2.5 rounded-xl border-2 text-left transition-all"
          style={{
            borderColor: payMethod === "wallet" ? "#d98c2a" : "#e5e5e5",
            backgroundColor: payMethod === "wallet" ? "rgba(217,140,42,0.08)" : "transparent",
          }}
        >
          <Wallet className="w-4 h-4 mb-1" style={{ color: "#d98c2a" }} />
          <p className="text-sm font-semibold text-neutral-800">Wallet</p>
          <p className="text-xs text-neutral-400">Balance: {fmt(walletBal)}</p>
        </button>
        <button
          onClick={() => setPayMethod("paystack")}
          className="p-2.5 rounded-xl border-2 text-left transition-all"
          style={{
            borderColor: payMethod === "paystack" ? "#d98c2a" : "#e5e5e5",
            backgroundColor: payMethod === "paystack" ? "rgba(217,140,42,0.08)" : "transparent",
          }}
        >
          <ShieldCheck className="w-4 h-4 text-green-500 mb-1" />
          <p className="text-sm font-semibold text-neutral-800">Paystack</p>
          <p className="text-xs text-neutral-400">Card / Transfer</p>
        </button>
      </div>

      {payMethod === "wallet" && walletBal < plan.price && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-700">
          <span>Insufficient balance.</span>
          <Link href="/digital/wallet" className="underline font-medium">Top up wallet</Link>
        </div>
      )}

      <button
        onClick={onPurchase}
        disabled={!canPurchase}
        className="w-full text-white py-3.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: "#c47020" }}
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Pay ${fmt(plan.price)}`}
      </button>
    </div>
  );
}
