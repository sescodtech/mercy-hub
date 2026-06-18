"use client";

import Link from "next/link";
import { Wallet, ShieldCheck, Loader2 } from "lucide-react";
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
}

export function OrderSummaryPanel({ plan, payMethod, setPayMethod, walletBal, loading, canPurchase, onPurchase }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <h3 className="font-medium text-neutral-700 mb-3 text-sm">Payment Method</h3>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => setPayMethod("wallet")}
          className="p-3 rounded-xl border-2 text-left transition-all"
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
          className="p-3 rounded-xl border-2 text-left transition-all"
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

      <div className="border-t border-neutral-100 pt-4 mb-4">
        <div className="flex justify-between text-sm text-neutral-600 mb-1">
          <span>Plan</span>
          <span className="font-medium text-neutral-900 text-right">{plan.name}</span>
        </div>
        <div className="flex justify-between text-sm font-bold mt-2">
          <span>Total</span>
          <span style={{ color: "#d98c2a" }}>{fmt(plan.price)}</span>
        </div>
      </div>

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
