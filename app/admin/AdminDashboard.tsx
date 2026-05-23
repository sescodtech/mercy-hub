"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag,
  Image as ImageIcon, Settings, TrendingUp, DollarSign,
  ArrowUpRight, ArrowDownRight, BarChart3, Menu, X,
} from "lucide-react";
import axios from "axios";
import { formatPrice, cn } from "@/utils";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
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

interface Stat {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

// Mock revenue data — replace with real aggregation from /api/admin/analytics
const MOCK_REVENUE = [
  { month: "Jul", revenue: 420000 },
  { month: "Aug", revenue: 580000 },
  { month: "Sep", revenue: 490000 },
  { month: "Oct", revenue: 720000 },
  { month: "Nov", revenue: 860000 },
  { month: "Dec", revenue: 1120000 },
  { month: "Jan", revenue: 940000 },
];

export function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    revenue: 0, orders: 0, customers: 0, products: 0,
    revGrowth: 12.4, ordersGrowth: 8.1, customersGrowth: 15.3, productsGrowth: 3.2,
  });
  const [recentOrders, setRecentOrders] = useState<unknown[]>([]);

  useEffect(() => {
    Promise.all([
      axios.get("/api/orders?limit=5"),
    ]).then(([ordersRes]) => {
      if (ordersRes.data.success) {
        const orders = ordersRes.data.data;
        setRecentOrders(orders);
        const revenue = orders.filter((o: { paymentStatus: string }) => o.paymentStatus === "paid")
          .reduce((s: number, o: { total: number }) => s + o.total, 0);
        setStats((p) => ({ ...p, revenue, orders: ordersRes.data.pagination?.total ?? orders.length }));
      }
    });
  }, []);

  const statCards: Stat[] = [
    { label: "Total Revenue",    value: formatPrice(stats.revenue), change: stats.revGrowth,       icon: DollarSign,  color: "text-brand-600",  bg: "bg-brand-50" },
    { label: "Total Orders",     value: String(stats.orders),       change: stats.ordersGrowth,    icon: ShoppingCart, color: "text-blue-600",  bg: "bg-blue-50" },
    { label: "Customers",        value: String(stats.customers),    change: stats.customersGrowth, icon: Users,        color: "text-purple-600",bg: "bg-purple-50" },
    { label: "Active Products",  value: String(stats.products),     change: stats.productsGrowth,  icon: Package,      color: "text-green-600", bg: "bg-green-50" },
  ];

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={cn(
      "flex flex-col bg-ebony text-cream/80 h-full",
      mobile ? "w-64" : "w-64 hidden lg:flex"
    )}>
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-semibold text-white">
            Mercy<span className="text-brand-400">Home</span>
          </span>
        </Link>
        <span className="text-[10px] tracking-[0.25em] uppercase text-white/30 block mt-0.5">
          Admin Panel
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all hover:bg-white/10 hover:text-white"
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <Link href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">
          ← Back to Store
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar mobile />
          </div>
          <button className="absolute top-4 left-[268px] text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-icon">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-semibold text-neutral-900">Dashboard Overview</h1>
          </div>
          <Link href="/shop" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
            View Store →
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(({ label, value, change, icon: Icon, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-xl p-5 border border-neutral-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", bg)}>
                    <Icon className={cn("w-5 h-5", color)} />
                  </div>
                  <div className={cn("flex items-center gap-0.5 text-xs font-medium", change >= 0 ? "text-green-600" : "text-red-500")}>
                    {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {Math.abs(change)}%
                  </div>
                </div>
                <p className="font-display text-2xl font-semibold text-neutral-900">{value}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-xl border border-neutral-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-neutral-900">Revenue Overview</h2>
              <TrendingUp className="w-5 h-5 text-brand-500" />
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={MOCK_REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [formatPrice(v), "Revenue"]} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#d98c2a"
                  strokeWidth={2.5}
                  dot={{ fill: "#d98c2a", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recent orders table */}
          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-xs text-brand-600 hover:text-brand-700">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {["Order #", "Customer", "Amount", "Status", "Payment", "Date"].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {recentOrders.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-400 text-sm">No orders yet</td></tr>
                  ) : (
                    recentOrders.map((order: unknown) => {
                      const o = order as {
                        _id: string; orderNumber: string;
                        user?: { name?: string };
                        total: number; orderStatus: string;
                        paymentStatus: string; createdAt: string;
                      };
                      return (
                        <tr key={o._id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-3 font-mono text-xs text-neutral-700">{o.orderNumber}</td>
                          <td className="px-6 py-3 text-neutral-700">{o.user?.name ?? "—"}</td>
                          <td className="px-6 py-3 font-medium text-neutral-900">{formatPrice(o.total)}</td>
                          <td className="px-6 py-3">
                            <span className="capitalize text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                              {o.orderStatus}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <span className={cn("capitalize text-xs font-medium", { paid: "text-green-600", pending: "text-yellow-600", failed: "text-red-500" }[o.paymentStatus] ?? "text-neutral-500")}>
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-neutral-400 text-xs">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Add Product",  href: "/admin/products/new",  icon: Package },
              { label: "View Orders",  href: "/admin/orders",         icon: ShoppingCart },
              { label: "Add Coupon",   href: "/admin/coupons/new",   icon: Tag },
              { label: "Add Banner",   href: "/admin/banners/new",   icon: ImageIcon },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className="bg-white rounded-xl border border-neutral-100 p-4 flex items-center gap-3 hover:border-brand-300 hover:shadow-brand-sm transition-all group">
                <Icon className="w-5 h-5 text-brand-500" />
                <span className="text-sm font-medium text-neutral-700">{label}</span>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
