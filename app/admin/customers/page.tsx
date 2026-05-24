"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Users, Mail, Phone, ShoppingBag, TrendingUp, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import axios from "axios";
import { formatPrice, formatDate, cn } from "@/utils";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  isVerified: boolean;
  orderCount: number;
  totalSpent: number;
  lastOrder: string | null;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, hasNext: false, hasPrev: false });
  const [sortBy, setSortBy] = useState<"createdAt" | "totalSpent" | "orderCount">("createdAt");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const { data } = await axios.get(`/api/admin/customers?${params}`);
      if (data.success) {
        setCustomers(data.data);
        setPagination(data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Client-side sort
  const sorted = [...customers].sort((a, b) => {
    if (sortBy === "totalSpent")  return b.totalSpent  - a.totalSpent;
    if (sortBy === "orderCount")  return b.orderCount  - a.orderCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const topSpender = customers.reduce((m, c) => c.totalSpent > (m?.totalSpent ?? 0) ? c : m, customers[0]);

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Customers</h1>
            <p className="text-sm text-neutral-400">{pagination.total} total customers</p>
          </div>
          <Link href="/admin" className="text-sm text-[#d98c2a]">← Dashboard</Link>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Customers", value: pagination.total, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Total Revenue",   value: customers.length ? formatPrice(customers.reduce((s, c) => s + c.totalSpent, 0)) : "—", icon: TrendingUp, color: "text-[#d98c2a]", bg: "bg-[#d98c2a]/10" },
            { label: "Total Orders",    value: customers.reduce((s, c) => s + c.orderCount, 0), icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Top Spender",     value: topSpender?.name?.split(" ")[0] ?? "—", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-neutral-100">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", bg)}>
                <Icon className={cn("w-5 h-5", color)} />
              </div>
              <p className="text-xl font-bold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg outline-none focus:border-[#d98c2a]"
            />
          </div>
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm outline-none bg-transparent text-neutral-700"
            >
              <option value="createdAt">Newest first</option>
              <option value="totalSpent">Highest spend</option>
              <option value="orderCount">Most orders</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {["Customer", "Contact", "Orders", "Total Spent", "Last Order", "Joined", "Status"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-medium text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-neutral-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <Users className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                      <p className="text-neutral-400 text-sm">
                        {debouncedSearch ? "No customers match your search." : "No customers yet."}
                      </p>
                    </td>
                  </tr>
                ) : sorted.map((c) => (
                  <tr key={c._id} className="hover:bg-neutral-50 transition-colors">
                    {/* Avatar + name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#d98c2a]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-[#d98c2a]">
                            {c.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{c.name}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-neutral-600">
                          <Mail className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                          <span className="text-xs">{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-neutral-500">
                            <Phone className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                            <span className="text-xs">{c.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Orders */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="font-semibold text-neutral-900">{c.orderCount}</span>
                      </div>
                    </td>

                    {/* Spent */}
                    <td className="px-5 py-4">
                      <span className={cn("font-semibold", c.totalSpent > 0 ? "text-[#d98c2a]" : "text-neutral-400")}>
                        {c.totalSpent > 0 ? formatPrice(c.totalSpent) : "—"}
                      </span>
                    </td>

                    {/* Last order */}
                    <td className="px-5 py-4 text-sm text-neutral-500">
                      {c.lastOrder
                        ? formatDate(c.lastOrder, { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-xs text-neutral-400">
                      {formatDate(c.createdAt, { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                        c.isVerified
                          ? "bg-green-50 text-green-700"
                          : "bg-neutral-100 text-neutral-500"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", c.isVerified ? "bg-green-500" : "bg-neutral-400")} />
                        {c.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!pagination.hasPrev}
                  className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:border-[#d98c2a] hover:text-[#d98c2a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-neutral-600">
                  {page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:border-[#d98c2a] hover:text-[#d98c2a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
