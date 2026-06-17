"use client";

/**
 * app/(pages)/digital/wallet/page.tsx
 * Customer wallet — view balance, top up via Paystack, see ledger
 */

import { useState, useEffect } from "react";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface LedgerEntry {
  type: "credit" | "debit";
  amount: number;
  note: string;
  date: string;
}

function fmt(n: number) { return `₦${(n || 0).toLocaleString("en-NG")}`; }
function dateStr(d: string) {
  return new Date(d).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function WalletPage() {
  const [balance,   setBalance]   = useState(0);
  const [ledger,    setLedger]    = useState<LedgerEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [amount,    setAmount]    = useState("");
  const [depositing,setDepositing]= useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    fetch("/api/digital/wallet/balance")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setBalance(d.balance);
          setLedger(d.recentLedger || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Show funded toast
    const url = new URL(window.location.href);
    if (url.searchParams.get("funded") === "1") {
      // Refresh balance after Paystack redirect
      setTimeout(() => {
        fetch("/api/digital/wallet/balance")
          .then(r => r.json())
          .then(d => { if (d.success) setBalance(d.balance); });
      }, 2000);
    }
  }, []);

  async function handleDeposit() {
    const amt = Number(amount);
    if (!amt || amt < 100) { setError("Minimum deposit is ₦100"); return; }
    if (amt > 500000)      { setError("Maximum deposit is ₦500,000"); return; }

    setDepositing(true);
    setError("");
    try {
      const r = await fetch("/api/digital/wallet/deposit", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount: amt }),
      });
      const d = await r.json();
      if (d.authorizationUrl) {
        window.location.href = d.authorizationUrl;
      } else {
        setError(d.error || "Failed to initialize payment");
        setDepositing(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setDepositing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf8f0]">

      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-4 flex items-center gap-3">
          <Link href="/digital" className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-neutral-900">My Wallet</h1>
            <p className="text-xs text-neutral-400">Fund your account for instant purchases</p>
          </div>
        </div>
      </div>

      <div className="container-site py-8 max-w-lg mx-auto space-y-5">

        {/* Balance card */}
        <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg, #1a1208 0%, #3c1c0b 100%)" }}>
          <div className="flex items-center gap-2 mb-4 opacity-70">
            <Wallet className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Available Balance</span>
          </div>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <p className="text-4xl font-bold mb-1">{fmt(balance)}</p>
          )}
          <p className="text-xs opacity-50 mt-1">MercyHub Digital Wallet</p>
        </div>

        {/* Top-up form */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#d98c2a]" /> Add Funds
          </h2>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {QUICK_AMOUNTS.map(a => (
              <button key={a}
                onClick={() => setAmount(String(a))}
                className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                  amount === String(a)
                    ? "border-[#d98c2a] bg-[#d98c2a]/10 text-[#d98c2a]"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                }`}>
                {fmt(a)}
              </button>
            ))}
          </div>

          <div className="relative mb-4">
            <span className="absolute left-4 top-3 text-neutral-400 text-sm">₦</span>
            <input
              type="number" value={amount}
              onChange={e => { setAmount(e.target.value); setError(""); }}
              placeholder="Enter custom amount"
              className="w-full border border-neutral-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-[#d98c2a] focus:ring-1 focus:ring-[#d98c2a]/30"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs mb-3">{error}</p>
          )}

          <button onClick={handleDeposit} disabled={depositing || !amount}
            className="w-full bg-[#c47020] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#a3551c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {depositing ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Paystack...</> : "Top Up via Paystack"}
          </button>

          <p className="text-center text-xs text-neutral-400 mt-3">Secured by Paystack · Instant credit</p>
        </div>

        {/* Recent transactions */}
        {ledger.length > 0 && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-5">
            <h2 className="font-semibold text-neutral-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {ledger.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    entry.type === "credit" ? "bg-green-50" : "bg-red-50"
                  }`}>
                    {entry.type === "credit"
                      ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      : <ArrowUpRight   className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 truncate">{entry.note || (entry.type === "credit" ? "Credit" : "Debit")}</p>
                    <p className="text-xs text-neutral-400">{dateStr(entry.date)}</p>
                  </div>
                  <span className={`text-sm font-bold ${entry.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                    {entry.type === "credit" ? "+" : "-"}{fmt(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/dashboard/digital-orders" className="text-sm text-[#d98c2a] hover:underline">
            View all digital orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
