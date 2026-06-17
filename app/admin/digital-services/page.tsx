"use client";

/**
 * app/admin/digital-services/page.tsx
 * Admin Digital Services dashboard — stats, markup, toggles, transactions
 */

import { useState, useEffect } from "react";
import {
  Wifi, Phone, Tv, BookOpen, TrendingUp, AlertCircle,
  CheckCircle, Loader2, RefreshCw, Settings, ChevronRight,
  RotateCcw, Search, Filter,
} from "lucide-react";
import Link from "next/link";

function fmt(n: number) { return `₦${(n || 0).toLocaleString("en-NG")}`; }
function dateStr(d: string) { return new Date(d).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }

interface Stats {
  totalOrders: number; fulfilledOrders: number; failedOrders: number;
  todayOrders: number; totalRevenue: number; totalCost: number;
  grossProfit: number; providerBalance: number;
}

interface Order {
  _id: string; orderRef: string; category: string; planName: string;
  phone?: string; amount: number; status: string; createdAt: string;
  retryCount: number;
  user?: { name: string; email: string };
}

interface Config {
  markup: { data: number; airtime: number; cable: number; education: number };
  services: { data: boolean; airtime: boolean; cable: boolean; education: boolean };
}

const CAT_ICONS: Record<string, typeof Wifi> = { data: Wifi, airtime: Phone, cable: Tv, education: BookOpen };
const STATUS_COLORS: Record<string, string> = {
  fulfilled: "bg-green-50 text-green-700 border-green-200",
  failed:    "bg-red-50 text-red-700 border-red-200",
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing:"bg-blue-50 text-blue-700 border-blue-200",
  refunded:  "bg-gray-50 text-gray-700 border-gray-200",
};

export default function AdminDigitalPage() {
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [config,   setConfig]   = useState<Config | null>(null);
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState("");
  const [catF,     setCatF]     = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [tab,      setTab]      = useState<"overview" | "settings" | "transactions">("overview");

  useEffect(() => {
    fetchStats();
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [page, search, statusF, catF]);

  async function fetchStats() {
    setLoading(true);
    const r = await fetch("/api/admin/digital/stats");
    const d = await r.json();
    if (d.success) setStats(d.stats);
    setLoading(false);
  }

  async function fetchConfig() {
    const r = await fetch("/api/admin/digital/markup");
    const d = await r.json();
    if (d.success) setConfig({ markup: d.markup, services: d.services });
  }

  async function fetchOrders() {
    const q = new URLSearchParams({ page: String(page), limit: "20" });
    if (search)  q.set("search", search);
    if (statusF) q.set("status", statusF);
    if (catF)    q.set("category", catF);
    const r = await fetch(`/api/admin/digital/transactions?${q}`);
    const d = await r.json();
    if (d.success) { setOrders(d.data); setTotal(d.pagination.total); }
  }

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    await fetch("/api/admin/digital/markup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
  }

  async function retryOrder(id: string) {
    setRetrying(id);
    const r = await fetch(`/api/admin/digital/retry/${id}`, { method: "POST" });
    const d = await r.json();
    if (d.success) fetchOrders();
    setRetrying(null);
  }

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Digital Services</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Manage data, airtime, cable TV, and education services</p>
        </div>
        <button onClick={fetchStats}
          className="flex items-center gap-2 text-sm text-neutral-500 border border-neutral-200 px-3 py-2 rounded-lg hover:bg-neutral-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {(["overview", "settings", "transactions"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              tab === t ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Overview ────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#d98c2a]" /></div>
          ) : stats ? (
            <>
              {/* Provider Balance Alert */}
              {stats.providerBalance < 5000 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Low Provider Balance</p>
                    <p className="text-xs text-red-600">GladTidings wallet: {fmt(stats.providerBalance)}. Top up to avoid failed orders.</p>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Orders",    value: stats.totalOrders,    sub: `${stats.todayOrders} today`,  color: "#d98c2a" },
                  { label: "Fulfilled",       value: stats.fulfilledOrders,sub: `${Math.round(stats.fulfilledOrders / Math.max(stats.totalOrders,1) * 100)}% rate`, color: "#10b981" },
                  { label: "Failed",          value: stats.failedOrders,   sub: "Need attention",              color: "#ef4444" },
                  { label: "Provider Wallet", value: fmt(stats.providerBalance), sub: "GladTidings", color: "#6366f1", isText: true },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-5">
                    <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">{s.label}</p>
                    <p className="text-2xl font-bold text-neutral-900">{s.isText ? s.value : s.value.toLocaleString()}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Revenue */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Revenue", value: stats.totalRevenue, icon: TrendingUp, color: "text-green-600 bg-green-50" },
                  { label: "Total Cost",    value: stats.totalCost,    icon: TrendingUp, color: "text-neutral-600 bg-neutral-50" },
                  { label: "Gross Profit",  value: stats.grossProfit,  icon: TrendingUp, color: "text-[#d98c2a] bg-[#d98c2a]/10" },
                ].map(r => (
                  <div key={r.label} className="bg-white rounded-2xl border border-neutral-100 p-5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${r.color}`}>
                      <r.icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs text-neutral-400 uppercase tracking-wide">{r.label}</p>
                    <p className="text-xl font-bold text-neutral-900 mt-0.5">{fmt(r.value)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Settings ─────────────────────────────────────────────── */}
      {tab === "settings" && config && (
        <div className="space-y-5">

          {/* Service Toggles */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4">Service Toggles</h2>
            <div className="space-y-3">
              {(["data", "airtime", "cable", "education"] as const).map(cat => {
                const Icon = CAT_ICONS[cat];
                return (
                  <div key={cat} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-4 h-4 text-neutral-600" />
                      </div>
                      <span className="font-medium text-neutral-800 capitalize">{cat}</span>
                    </div>
                    <button
                      onClick={() => setConfig(c => c ? { ...c, services: { ...c.services, [cat]: !c.services[cat] } } : c)}
                      className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                        config.services[cat] ? "bg-[#d98c2a]" : "bg-neutral-200"
                      }`}>
                      <span className={`inline-block w-4 h-4 transform rounded-full bg-white shadow transition-transform mt-1 ${
                        config.services[cat] ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Markup % */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-semibold text-neutral-900 mb-1">Markup Percentages</h2>
            <p className="text-sm text-neutral-400 mb-5">Percentage added to GladTidings cost price for customer-facing prices.</p>
            <div className="grid grid-cols-2 gap-4">
              {(["data", "airtime", "cable", "education"] as const).map(cat => (
                <div key={cat}>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5 capitalize">{cat}</label>
                  <div className="relative">
                    <input
                      type="number" min={0} max={100} value={config.markup[cat]}
                      onChange={e => setConfig(c => c ? { ...c, markup: { ...c.markup, [cat]: Number(e.target.value) } } : c)}
                      className="w-full border border-neutral-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-[#d98c2a]"
                    />
                    <span className="absolute right-3 top-3 text-sm text-neutral-400">%</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={saveConfig} disabled={saving}
              className="mt-5 w-full bg-[#c47020] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#a3551c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* ── Transactions ─────────────────────────────────────────── */}
      {tab === "transactions" && (
        <div className="space-y-4">

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by ref, phone…"
                className="w-full border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#d98c2a]"
              />
            </div>
            <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}
              className="border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]">
              <option value="">All Status</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
            </select>
            <select value={catF} onChange={e => { setCatF(e.target.value); setPage(1); }}
              className="border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]">
              <option value="">All Categories</option>
              <option value="data">Data</option>
              <option value="airtime">Airtime</option>
              <option value="cable">Cable</option>
              <option value="education">Education</option>
            </select>
          </div>

          {/* Orders table */}
          <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Order</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {orders.map(o => {
                    const Icon = CAT_ICONS[o.category] || Wifi;
                    return (
                      <tr key={o._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="font-mono text-xs text-neutral-500">{o.orderRef}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-800 text-xs">{o.user?.name || "—"}</p>
                          <p className="text-neutral-400 text-xs">{o.phone || o.user?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-neutral-800 text-xs font-medium">{o.planName}</p>
                          <p className="text-neutral-400 text-xs capitalize">{o.category}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-neutral-900 text-xs">{fmt(o.amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[o.status] || "bg-neutral-50 text-neutral-600 border-neutral-200"}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-400">{dateStr(o.createdAt)}</td>
                        <td className="px-4 py-3">
                          {o.status === "failed" && o.retryCount < 3 && (
                            <button onClick={() => retryOrder(o._id)}
                              disabled={retrying === o._id}
                              className="flex items-center gap-1 text-xs text-[#d98c2a] hover:underline disabled:opacity-50">
                              {retrying === o._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {orders.length === 0 && (
                <div className="py-16 text-center text-neutral-400 text-sm">No orders found</div>
              )}
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between text-sm text-neutral-500">
                <span>{total} total orders</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50">
                    Prev
                  </button>
                  <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50">
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
