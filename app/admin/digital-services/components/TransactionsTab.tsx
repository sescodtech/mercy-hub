"use client";

import { useEffect, useState } from "react";
import { Wifi, Phone, Tv, BookOpen, Loader2, RotateCcw, Search, Download } from "lucide-react";
import { fmt, dateStr } from "../utils";

interface Order {
  _id: string; orderRef: string; category: string; planName: string;
  phone?: string; amount: number; status: string; createdAt: string;
  retryCount: number;
  user?: { name: string; email: string };
}

const CAT_ICONS: Record<string, typeof Wifi> = { data: Wifi, airtime: Phone, cable: Tv, education: BookOpen };
const STATUS_COLORS: Record<string, string> = {
  fulfilled: "bg-green-50 text-green-700 border-green-200",
  failed:    "bg-red-50 text-red-700 border-red-200",
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing:"bg-blue-50 text-blue-700 border-blue-200",
  refunded:  "bg-gray-50 text-gray-700 border-gray-200",
};

export function TransactionsTab() {
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [statusF,  setStatusF]  = useState("");
  const [catF,     setCatF]     = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, [page, search, statusF, catF]);

  async function fetchOrders() {
    const q = new URLSearchParams({ page: String(page), limit: "20" });
    if (search)  q.set("search", search);
    if (statusF) q.set("status", statusF);
    if (catF)    q.set("category", catF);
    const r = await fetch(`/api/admin/digital/transactions?${q}`);
    const d = await r.json();
    if (d.success) { setOrders(d.data); setTotal(d.pagination.total); }
  }

  async function retryOrder(id: string) {
    setRetrying(id);
    const r = await fetch(`/api/admin/digital/retry/${id}`, { method: "POST" });
    const d = await r.json();
    if (d.success) fetchOrders();
    setRetrying(null);
  }

  function exportCsv() {
    const q = new URLSearchParams();
    if (search)  q.set("search", search);
    if (statusF) q.set("status", statusF);
    if (catF)    q.set("category", catF);
    window.location.href = `/api/admin/digital/export?${q}`;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by ref, phone…"
            className="w-full border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#d98c2a]"
          />
        </div>
        <select value={statusF} onChange={(e) => { setStatusF(e.target.value); setPage(1); }}
          className="border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]">
          <option value="">All Status</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
        </select>
        <select value={catF} onChange={(e) => { setCatF(e.target.value); setPage(1); }}
          className="border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]">
          <option value="">All Categories</option>
          <option value="data">Data</option>
          <option value="airtime">Airtime</option>
          <option value="cable">Cable</option>
          <option value="education">Education</option>
        </select>
        <button onClick={exportCsv}
          className="flex items-center gap-2 text-sm font-medium text-neutral-700 border border-neutral-200 px-3 py-2 rounded-xl hover:bg-neutral-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
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
              {orders.map((o) => {
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
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50">
                Prev
              </button>
              <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
