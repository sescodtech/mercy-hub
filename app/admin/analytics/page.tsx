"use client";

import Link from "next/link";
import { useState } from "react";
import { RefreshCw, TrendingUp, ShoppingCart, Users, DollarSign } from "lucide-react";
import { useRealtimeAnalytics } from "@/hooks/useRealtime";
import { formatPrice, cn } from "@/utils";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const COLORS = ["#d98c2a", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("30");
  const { data: analytics, loading, lastUpdated, refresh } = useRealtimeAnalytics(range);

  const a = analytics as Record<string, unknown> | null;
  const overview            = a?.overview            as Record<string, number> | undefined;
  const revenueOverTime     = (a?.revenueOverTime     as Record<string, unknown>[] | undefined) ?? [];
  const topProducts         = (a?.topProducts         as Record<string, unknown>[] | undefined) ?? [];
  const categoryPerformance = (a?.categoryPerformance as Record<string, unknown>[] | undefined) ?? [];
  const orderStatusBreakdown= (a?.orderStatusBreakdown as Record<string, unknown>[] | undefined) ?? [];

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="bg-white border-b border-neutral-200 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Analytics</h1>
            {lastUpdated && <p className="text-xs text-neutral-400">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="text-sm border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-[#d98c2a]"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button onClick={refresh} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#d98c2a] text-white rounded-lg hover:bg-[#c47020]">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </button>
            <Link href="/admin" className="text-sm text-[#d98c2a]">← Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue",     value: overview ? formatPrice(overview.totalRevenue) : "—",    icon: DollarSign,   color: "text-[#d98c2a]",  bg: "bg-[#d98c2a]/10" },
            { label: "Total Orders",      value: String(overview?.totalOrders ?? "—"),                   icon: ShoppingCart, color: "text-blue-600",   bg: "bg-blue-50" },
            { label: "New Customers",     value: String(overview?.totalCustomers ?? "—"),                icon: Users,        color: "text-purple-600", bg: "bg-purple-50" },
            { label: "Avg Order Value",   value: overview ? formatPrice(overview.avgOrderValue) : "—",   icon: TrendingUp,   color: "text-green-600",  bg: "bg-green-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-neutral-100">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bg)}>
                <Icon className={cn("w-5 h-5", color)} />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Revenue over time - full width */}
        <div className="bg-white rounded-xl border border-neutral-100 p-6">
          <h2 className="font-semibold text-neutral-900 mb-1">Revenue Over Time</h2>
          <p className="text-xs text-neutral-400 mb-5">Daily revenue for the last {range} days</p>
          {loading ? <div className="h-72 skeleton rounded-lg" /> : revenueOverTime.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-neutral-400">No revenue data yet — place some orders!</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => `₦${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [formatPrice(v), "Revenue"]} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#d98c2a" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" strokeWidth={2} dot={false} yAxisId={1} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders bar + Category pie */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-neutral-100 p-6">
            <h2 className="font-semibold text-neutral-900 mb-1">Daily Orders</h2>
            <p className="text-xs text-neutral-400 mb-5">Order volume per day</p>
            {loading ? <div className="h-56 skeleton rounded-lg" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueOverTime.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="orders" name="Orders" fill="#d98c2a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-neutral-100 p-6">
            <h2 className="font-semibold text-neutral-900 mb-1">Category Performance</h2>
            <p className="text-xs text-neutral-400 mb-5">Revenue breakdown by category</p>
            {loading ? <div className="h-56 skeleton rounded-lg" /> : categoryPerformance.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-neutral-400">No category data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryPerformance} cx="50%" cy="50%" outerRadius={85} dataKey="revenue" nameKey="_id" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryPerformance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatPrice(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top products + Order status */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top products ranking */}
          <div className="bg-white rounded-xl border border-neutral-100 p-6">
            <h2 className="font-semibold text-neutral-900 mb-5">Top Selling Products</h2>
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}</div>
            ) : topProducts.length === 0 ? (
              <div className="py-8 text-center text-neutral-400">No product sales yet</div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{p.name as string}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, ((p.totalSold as number) / ((topProducts[0]?.totalSold as number) || 1)) * 100)}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }} />
                        </div>
                        <span className="text-xs text-neutral-500 flex-shrink-0">{p.totalSold as number} units</span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900 flex-shrink-0">{formatPrice(p.totalRevenue as number)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order status breakdown */}
          <div className="bg-white rounded-xl border border-neutral-100 p-6">
            <h2 className="font-semibold text-neutral-900 mb-5">Order Status Breakdown</h2>
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 skeleton rounded-lg" />)}</div>
            ) : orderStatusBreakdown.length === 0 ? (
              <div className="py-8 text-center text-neutral-400">No order data yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={orderStatusBreakdown} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="_id" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#d98c2a" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {orderStatusBreakdown.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-neutral-600 capitalize">{s._id as string}</span>
                      <span className="font-semibold text-neutral-900 ml-auto">{s.count as number}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
