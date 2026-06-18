"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, Wallet, X, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { fmt, dateStr } from "../utils";

interface WalletRow {
  _id: string;
  user: { _id: string; name: string; email: string };
  balance: number;
  updatedAt: string;
}

interface LedgerEntry { type: "credit" | "debit"; amount: number; note: string; date: string; ref?: string }

export function WalletsTab() {
  const [search,   setSearch]   = useState("");
  const [wallets,  setWallets]  = useState<WalletRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<WalletRow | null>(null);
  const [ledger,   setLedger]   = useState<LedgerEntry[]>([]);
  const [detailLoad, setDetailLoad] = useState(false);
  const [action,   setAction]   = useState<"credit" | "debit">("credit");
  const [amount,   setAmount]   = useState("");
  const [note,     setNote]     = useState("");
  const [adjusting,setAdjusting]= useState(false);

  useEffect(() => { const t = setTimeout(fetchWallets, 300); return () => clearTimeout(t); }, [search]);

  async function fetchWallets() {
    setLoading(true);
    const q = new URLSearchParams({ limit: "20" });
    if (search) q.set("search", search);
    const r = await fetch(`/api/admin/digital/wallets?${q}`);
    const d = await r.json();
    if (d.success) setWallets(d.data);
    setLoading(false);
  }

  async function openWallet(w: WalletRow) {
    setSelected(w);
    setDetailLoad(true);
    setAmount(""); setNote("");
    const r = await fetch(`/api/admin/digital/wallets/${w.user._id}`);
    const d = await r.json();
    if (d.success) setLedger(d.data.ledger);
    setDetailLoad(false);
  }

  async function submitAdjustment() {
    if (!selected || !amount || Number(amount) <= 0) return;
    setAdjusting(true);
    const r = await fetch(`/api/admin/digital/wallets/${selected.user._id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, amount: Number(amount), note }),
    });
    const d = await r.json();
    if (d.success) {
      setSelected({ ...selected, balance: d.balance });
      setAmount(""); setNote("");
      openWallet({ ...selected, balance: d.balance });
      fetchWallets();
    } else {
      alert(d.error || "Adjustment failed");
    }
    setAdjusting(false);
  }

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      {/* List */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="p-4 border-b border-neutral-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer name or email…"
              className="w-full border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#d98c2a]" /></div>
        ) : wallets.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-10">No wallets found</p>
        ) : (
          <div className="divide-y divide-neutral-50 max-h-[28rem] overflow-y-auto">
            {wallets.map((w) => (
              <button key={w._id} onClick={() => openWallet(w)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-50 transition-colors ${selected?._id === w._id ? "bg-amber-50" : ""}`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">{w.user?.name || "—"}</p>
                  <p className="text-xs text-neutral-400 truncate">{w.user?.email}</p>
                </div>
                <span className="text-sm font-semibold text-neutral-900 flex-shrink-0 ml-3">{fmt(w.balance)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-neutral-100 p-5">
        {!selected ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <Wallet className="w-8 h-8 mb-2" />
            <p className="text-sm">Select a customer to view wallet details</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-neutral-900">{selected.user?.name}</p>
                <p className="text-xs text-neutral-400">{selected.user?.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-neutral-400 hover:text-neutral-700"><X className="w-4 h-4" /></button>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Current Balance</p>
              <p className="text-2xl font-bold" style={{ color: "#c47020" }}>{fmt(selected.balance)}</p>
            </div>

            {/* Manual adjustment */}
            <div className="border border-neutral-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-neutral-800 mb-3">Manual Adjustment</p>
              <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit mb-3">
                <button onClick={() => setAction("credit")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${action === "credit" ? "bg-white text-green-600 shadow-sm" : "text-neutral-500"}`}>
                  <ArrowUpCircle className="w-3.5 h-3.5" /> Credit
                </button>
                <button onClick={() => setAction("debit")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${action === "debit" ? "bg-white text-red-500 shadow-sm" : "text-neutral-500"}`}>
                  <ArrowDownCircle className="w-3.5 h-3.5" /> Debit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (₦)"
                  className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" />
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (e.g. refund for MH-DIG…)"
                  className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" />
              </div>
              <button onClick={submitAdjustment} disabled={adjusting || !amount}
                className="w-full bg-[#c47020] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#a3551c] disabled:opacity-50 flex items-center justify-center gap-2">
                {adjusting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Apply {action === "credit" ? "Credit" : "Debit"}
              </button>
            </div>

            {/* Ledger */}
            <div>
              <p className="text-sm font-semibold text-neutral-800 mb-2">Recent Ledger</p>
              {detailLoad ? (
                <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-[#d98c2a]" /></div>
              ) : ledger.length === 0 ? (
                <p className="text-sm text-neutral-400 py-4 text-center">No wallet activity yet</p>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-neutral-50 border border-neutral-100 rounded-xl">
                  {ledger.map((l, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <p className="text-xs text-neutral-700">{l.note || (l.type === "credit" ? "Credit" : "Debit")}</p>
                        <p className="text-xs text-neutral-400">{dateStr(l.date)}</p>
                      </div>
                      <span className={`text-sm font-semibold ${l.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                        {l.type === "credit" ? "+" : "−"}{fmt(l.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
