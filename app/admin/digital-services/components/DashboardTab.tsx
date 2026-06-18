"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw, Wallet, TrendingUp, Users, CheckCircle2, XCircle } from "lucide-react";
import { fmt } from "../utils";

interface Stats {
  totalOrders: number; fulfilledOrders: number; failedOrders: number;
  todayOrders: number; totalRevenue: number; totalCost: number;
  grossProfit: number; providerBalance: number; providerConnected: boolean;
  customerCount: number; platformWalletTotal: number;
  failureBreakdown: { reason: string; count: number }[];
  categoryBreakdown: { category: string; orders: number; revenue: number; profit: number }[];
}

export function DashboardTab() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    setLoading(true);
    const r = await fetch("/api/admin/digital/stats");
    const d = await r.json();
    if (d.success) setStats(d.stats);
    setLoading(false);
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#d98c2a]" /></div>;
  }
  if (!stats) return <p className="text-sm text-neutral-400 py-10 text-center">Couldn't load dashboard stats.</p>;

  const failedDeliveries = stats.failureBreakdown.reduce((sum, f) => sum + f.count, 0);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={fetchStats} className="flex items-center gap-2 text-sm text-neutral-500 border border-neutral-200 px-3 py-2 rounded-lg hover:bg-neutral-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Provider balance alert */}
      {stats.providerBalance < 5000 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Low Provider Balance</p>
            <p className="text-xs text-red-600">GladTidings wallet: {fmt(stats.providerBalance)}. Top up to avoid failed orders.</p>
          </div>
        </div>
      )}

      {/* Failed deliveries banner — mirrors the old DATAHUB "Failed Deliveries Detected" alert */}
      {failedDeliveries > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Failed Deliveries Detected</p>
            <p className="text-xs text-amber-600">
              Reasons → {stats.failureBreakdown.map((f) => `${f.reason}: ${f.count}`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Provider connectivity */}
      <div className="flex items-center gap-2 text-xs">
        {stats.providerConnected ? (
          <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Provider connected</span>
        ) : (
          <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3.5 h-3.5" /> Provider unreachable — check Diagnostics tab</span>
        )}
      </div>

      {/* Stats grid — 8 cards, matches the old DATAHUB dashboard density */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Transactions", value: stats.totalOrders,            sub: `${stats.todayOrders} today`,        icon: TrendingUp, color: "#d98c2a" },
          { label: "Revenue",             value: fmt(stats.totalRevenue),     sub: "All time",                          icon: Wallet,     color: "#10b981", isText: true },
          { label: "Profit",              value: fmt(stats.grossProfit),      sub: "Revenue − cost",                    icon: TrendingUp, color: "#6366f1", isText: true },
          { label: "Customers",           value: stats.customerCount,         sub: "Unique buyers",                     icon: Users,      color: "#0ea5e9" },
          { label: "Fulfilled",           value: stats.fulfilledOrders,       sub: `${Math.round(stats.fulfilledOrders / Math.max(stats.totalOrders, 1) * 100)}% rate`, icon: CheckCircle2, color: "#10b981" },
          { label: "Failed",              value: stats.failedOrders,          sub: "Need attention",                    icon: XCircle,    color: "#ef4444" },
          { label: "Platform Wallet",     value: fmt(stats.platformWalletTotal), sub: "Customer balances",              icon: Wallet,     color: "#f59e0b", isText: true },
          { label: "Provider Wallet",     value: fmt(stats.providerBalance),  sub: "GladTidings",                       icon: Wallet,     color: "#6366f1", isText: true },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wide">{s.label}</span>
                <Icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className={s.isText ? "text-lg font-bold text-neutral-900" : "text-2xl font-bold text-neutral-900"}>{s.value}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Performance by Category</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Category</th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Orders</th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Revenue</th>
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {stats.categoryBreakdown.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-neutral-400">No fulfilled orders yet</td></tr>
            )}
            {stats.categoryBreakdown.map((c) => (
              <tr key={c.category}>
                <td className="px-5 py-3 capitalize font-medium text-neutral-800">{c.category}</td>
                <td className="px-5 py-3 text-neutral-600">{c.orders}</td>
                <td className="px-5 py-3 text-neutral-900 font-medium">{fmt(c.revenue)}</td>
                <td className="px-5 py-3 text-green-600 font-medium">{fmt(c.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
