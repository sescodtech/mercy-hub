"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag,
  Image as ImageIcon, Settings, TrendingUp, DollarSign,
  ArrowUpRight, ArrowDownRight, BarChart3, Menu, X,
  Bell, RefreshCw, AlertTriangle, Clock, CheckCircle,
  Truck, XCircle, Eye,
} from "lucide-react";
import axios from "axios";
import { formatPrice, cn } from "@/utils";
import { useRealtimeOrders, useRealtimeAnalytics } from "@/hooks/useRealtime";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const NAV = [
  { icon: LayoutDashboard, label: "Overview",   href: "/admin" },
  { icon: Package,         label: "Products",   href: "/admin/products" },
  { icon: ShoppingCart,    label: "Orders",     href: "/admin/orders" },
  { icon: Users,           label: "Customers",  href: "/admin/customers" },
  { icon: BarChart3,       label: "Analytics",  href: "/admin/analytics" },
  { icon: Tag,             label: "Coupons",    href: "/admin/coupons" },
  { icon: ImageIcon,       label: "Banners",    href: "/admin/banners" },
  { icon: Settings,        label: "Settings",   href: "/admin/settings" },
];

const COLORS = ["#d98c2a", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending:    { color: "text-yellow-600 bg-yellow-50",  icon: Clock,        label: "Pending" },
  confirmed:  { color: "text-blue-600 bg-blue-50",      icon: CheckCircle,  label: "Confirmed" },
  processing: { color: "text-purple-600 bg-purple-50",  icon: RefreshCw,    label: "Processing" },
  shipped:    { color: "text-indigo-600 bg-indigo-50",  icon: Truck,        label: "Shipped" },
  delivered:  { color: "text-green-600 bg-green-50",    icon: CheckCircle,  label: "Delivered" },
  cancelled:  { color: "text-red-600 bg-red-50",        icon: XCircle,      label: "Cancelled" },
};

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className={cn("flex flex-col h-full", mobile ? "w-64" : "w-64 hidden lg:flex")}
      style={{ backgroundColor: "#1a1208", color: "rgba(255,255,255,0.7)" }}>
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="block">
          <span style={{ fontFamily: "serif", fontSize: "1.25rem", fontWeight: 600, color: "white" }}>
            Mercy<span style={{ color: "#d98c2a" }}>Home</span>
          </span>
          <span style={{ fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", display: "block", marginTop: "2px" }}>
            Admin Panel
          </span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ icon: Icon, label, href }) => (
          <Link key={href} href={href} onClick={onClose}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
              pathname === href ? "text-[#d98c2a]" : "hover:text-white")}
            style={pathname === href ? { backgroundColor: "rgba(217,140,42,0.2)" } : {}}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-white/10">
        <Link href="/" style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>← Back to Store</Link>
      </div>
    </aside>
  );
}

export function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [range, setRange] = useState("30");
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const { notifications, unreadCount, markAllRead } = useRealtimeOrders({ interval: 30000 });
  const { data: analytics, loading, lastUpdated, refresh } = useRealtimeAnalytics(range);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);
    try {
      await axios.patch(`/api/orders/${orderId}`, { orderStatus: status });
      refresh();
    } catch { /* silent */ }
    finally { setUpdatingOrder(null); }
  };

  const a = analytics as Record<string, unknown> | null;
  const overview           = a?.overview           as Record<string, number> | undefined;
  const revenueOverTime    = (a?.revenueOverTime    as unknown[] | undefined) ?? [];
  const topProducts        = (a?.topProducts        as Record<string, unknown>[] | undefined) ?? [];
  const categoryPerformance= (a?.categoryPerformance as Record<string, unknown>[] | undefined) ?? [];
  const recentOrders       = (a?.recentOrders       as Record<string, unknown>[] | undefined) ?? [];
  const lowStockProducts   = (a?.lowStockProducts   as Record<string, unknown>[] | undefined) ?? [];

  const statCards = [
    { label: "Total Revenue",   value: overview ? formatPrice(overview.totalRevenue ?? 0) : "—", change: overview?.revenueGrowth ?? 0, icon: DollarSign,   color: "text-[#d98c2a]",  bg: "bg-[#d98c2a]/10" },
    { label: "Total Orders",    value: String(overview?.totalOrders ?? "—"),    change: 8.1,  icon: ShoppingCart, color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "Customers",       value: String(overview?.totalCustomers ?? "—"), change: 15.3, icon: Users,        color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Active Products", value: String(overview?.totalProducts ?? "—"),  change: 3.2,  icon: Package,      color: "text-green-600",  bg: "bg-green-50" },
  ];

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      <Sidebar />

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="absolute left-0 top-0 h-full">
              <Sidebar mobile onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-neutral-100">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-neutral-900">Dashboard Overview</h1>
              {lastUpdated && <p className="text-xs text-neutral-400">Updated {lastUpdated.toLocaleTimeString()}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={range} onChange={(e) => setRange(e.target.value)}
              className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 outline-none">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button onClick={refresh} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-2xl border border-neutral-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                      <h3 className="font-semibold text-sm text-neutral-900">
                        Notifications {unreadCount > 0 && <span className="text-xs text-[#d98c2a]">({unreadCount} new)</span>}
                      </h3>
                      <div className="flex gap-2 items-center">
                        {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-[#d98c2a] hover:underline">Mark all read</button>}
                        <button onClick={() => setNotifOpen(false)}><X className="w-4 h-4 text-neutral-400" /></button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-neutral-400">No notifications yet</div>
                      ) : notifications.map((n) => (
                        <div key={n.id} className={cn("px-4 py-3 border-b border-neutral-50 text-sm", !n.read && "bg-[#d98c2a]/5")}>
                          <div className="flex items-start gap-2">
                            <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", !n.read ? "bg-[#d98c2a]" : "bg-neutral-300")} />
                            <div>
                              <p className="text-neutral-800 font-medium">{n.message}</p>
                              <p className="text-neutral-400 text-xs mt-0.5">{new Date(n.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link href="/shop" className="text-xs text-[#d98c2a] hidden sm:block">View Store →</Link>
          </div>
        </header>

        {/* Main scrollable */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, change, icon: Icon, color, bg }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }} className="bg-white rounded-xl p-5 border border-neutral-100">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                    <Icon className={cn("w-5 h-5", color)} />
                  </div>
                  <div className={cn("flex items-center gap-0.5 text-xs font-medium", change >= 0 ? "text-green-600" : "text-red-500")}>
                    {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(change)}%
                  </div>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{value}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts row 1 */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-neutral-900">Revenue Over Time</h2>
                  <p className="text-xs text-neutral-400">Last {range} days</p>
                </div>
                <TrendingUp className="w-5 h-5 text-[#d98c2a]" />
              </div>
              {loading ? <div className="h-52 skeleton rounded-lg" /> : revenueOverTime.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-neutral-400 text-sm">No sales data yet — place a test order!</div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={revenueOverTime as Record<string, unknown>[]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v: number) => `₦${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [formatPrice(v), "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#d98c2a" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 p-6">
              <h2 className="font-semibold text-neutral-900 mb-1">Category Sales</h2>
              <p className="text-xs text-neutral-400 mb-4">Revenue by category</p>
              {loading ? <div className="h-52 skeleton rounded-lg" /> : categoryPerformance.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-neutral-400 text-sm">No data yet</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={categoryPerformance} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="revenue" nameKey="_id">
                        {categoryPerformance.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatPrice(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {categoryPerformance.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-neutral-600">{cat._id as string}</span>
                        </div>
                        <span className="font-medium">{formatPrice(cat.revenue as number)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-neutral-100 p-6">
              <h2 className="font-semibold text-neutral-900 mb-1">Orders Per Day</h2>
              <p className="text-xs text-neutral-400 mb-4">Last 14 days</p>
              {loading ? <div className="h-44 skeleton rounded-lg" /> : (
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart data={(revenueOverTime as Record<string, unknown>[]).slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#d98c2a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 p-6">
              <h2 className="font-semibold text-neutral-900 mb-4">Top Products</h2>
              {loading ? (
                <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 skeleton rounded-lg" />)}</div>
              ) : topProducts.length === 0 ? (
                <div className="py-8 text-center text-sm text-neutral-400">No sales data yet</div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500 flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{p.name as string}</p>
                        <div className="h-1.5 bg-neutral-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, ((p.totalSold as number) / (topProducts[0]?.totalSold as number || 1)) * 100)}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-neutral-900">{p.totalSold as number} sold</p>
                        <p className="text-xs text-neutral-400">{formatPrice(p.totalRevenue as number)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent orders + low stock */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h2 className="font-semibold text-neutral-900">Recent Orders</h2>
                <Link href="/admin/orders" className="text-xs text-[#d98c2a]">View all →</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-50 bg-neutral-50">
                      {["Order #", "Customer", "Total", "Status", "Update"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {loading ? (
                      [...Array(4)].map((_, i) => (
                        <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>)}</tr>
                      ))
                    ) : recentOrders.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">No orders yet</td></tr>
                    ) : recentOrders.map((order) => {
                      const sk = order.orderStatus as string;
                      const status = STATUS_CONFIG[sk] ?? STATUS_CONFIG.pending;
                      const StatusIcon = status.icon;
                      const user = order.user as { name?: string } | null;
                      return (
                        <tr key={order._id as string} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-neutral-600">{order.orderNumber as string}</td>
                          <td className="px-4 py-3 text-sm text-neutral-700">{user?.name ?? "Guest"}</td>
                          <td className="px-4 py-3 font-semibold text-neutral-900">{formatPrice(order.total as number)}</td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full capitalize", status.color)}>
                              <StatusIcon className="w-3 h-3" />{status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={sk}
                              onChange={(e) => updateOrderStatus(order._id as string, e.target.value)}
                              disabled={updatingOrder === order._id}
                              className="text-xs border border-neutral-200 rounded px-2 py-1 outline-none cursor-pointer"
                            >
                              {Object.keys(STATUS_CONFIG).map((s) => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-neutral-900">Low Stock</h2>
              </div>
              {loading ? (
                <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}</div>
              ) : lowStockProducts.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">All products well stocked!</p>
                </div>
              ) : lowStockProducts.map((p) => (
                <div key={p._id as string} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-800 truncate">{p.name as string}</p>
                    <p className="text-xs text-orange-600 font-semibold">{p.stock as number} left</p>
                  </div>
                  <Link href="/admin/products">
                    <Eye className="w-3.5 h-3.5 text-neutral-400 hover:text-[#d98c2a]" />
                  </Link>
                </div>
              ))}
              <Link href="/admin/products" className="block text-center text-xs text-[#d98c2a] mt-3">Manage Inventory →</Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
