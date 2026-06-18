"use client";

import { useEffect, useState } from "react";
import { Loader2, Download, BarChart3 } from "lucide-react";
import { fmt } from "../utils";

interface CategoryStat { category: string; orders: number; revenue: number; profit: number }
interface Stats {
  totalRevenue: number; grossProfit: number; totalOrders: number; todayOrders: number;
  categoryBreakdown: CategoryStat[];
}

const CAT_COLOR: Record<string, string> = { data: "#d98c2a", airtime: "#10b981", cable: "#6366f1", education: "#f59e0b" };

export function ReportsTab() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/digital/stats").then((r) => r.json()).then((d) => { if (d.success) setStats(d.stats); setLoading(false); });
  }, []);

  const maxRevenue = stats ? Math.max(1, ...stats.categoryBreakdown.map((c) => c.revenue)) : 1;

  function exportAll() {
    window.location.href = "/api/admin/digital/export";
  }

  return (
    <div className="space-y-5">
      {/* Export */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-neutral-900 mb-1">Export Data</h2>
          <p className="text-sm text-neutral-400">Download every digital order as a CSV file, ready for Excel or Google Sheets.</p>
        </div>
        <button onClick={exportAll}
          className="flex items-center gap-2 bg-[#c47020] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a3551c]">
          <Download className="w-4 h-4" /> Download CSV
        </button>
      </div>
      <p className="text-xs text-neutral-400">
        Need a filtered export (just failed orders, just one category)? Use the Export button on the Transactions tab — it respects whatever filters you've applied there.
      </p>

      {/* Business analytics */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-neutral-500" />
          <h2 className="font-semibold text-neutral-900">Revenue by Category</h2>
        </div>
        <p className="text-sm text-neutral-400 mb-5">Based on all fulfilled orders to date.</p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#d98c2a]" /></div>
        ) : !stats || stats.categoryBreakdown.length === 0 ? (
          <p className="text-sm text-neutral-400 py-6 text-center">No fulfilled orders yet — reports will populate as sales come in.</p>
        ) : (
          <div className="space-y-4">
            {stats.categoryBreakdown
              .slice()
              .sort((a, b) => b.revenue - a.revenue)
              .map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize font-medium text-neutral-700">{c.category}</span>
                    <span className="text-neutral-500">{fmt(c.revenue)} · {c.orders} orders</span>
                  </div>
                  <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(c.revenue / maxRevenue) * 100}%`, backgroundColor: CAT_COLOR[c.category] || "#d98c2a" }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Performance summary */}
      {stats && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Performance Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Total Orders</p>
              <p className="font-semibold text-neutral-900 text-lg">{stats.totalOrders}</p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Today</p>
              <p className="font-semibold text-neutral-900 text-lg">{stats.todayOrders}</p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Total Revenue</p>
              <p className="font-semibold text-neutral-900 text-lg">{fmt(stats.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Total Profit</p>
              <p className="font-semibold text-green-600 text-lg">{fmt(stats.grossProfit)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
