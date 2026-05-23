"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Package, Heart, User, MapPin, Star,
  TrendingUp, ShoppingBag, ArrowRight, Clock,
} from "lucide-react";
import axios from "axios";
import { formatPrice, formatDate } from "@/utils";
import { useWishlistStore } from "@/hooks/useWishlist";
import type { IOrder } from "@/types";
import { cn } from "@/utils";

interface DashboardUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  shipped:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered:  "bg-green-50 text-green-700 border-green-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
};

export function DashboardClient({ user }: { user: DashboardUser }) {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const wishlistItems = useWishlistStore((s) => s.items);

  useEffect(() => {
    axios.get("/api/orders?limit=5")
      .then(({ data }) => { if (data.success) setOrders(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);

  const stats = [
    { icon: Package,     label: "Total Orders",     value: orders.length, color: "text-blue-600",  bg: "bg-blue-50" },
    { icon: TrendingUp,  label: "Total Spent",       value: formatPrice(totalSpent), color: "text-brand-600", bg: "bg-brand-50" },
    { icon: Heart,       label: "Wishlist Items",    value: wishlistItems.length, color: "text-red-500",   bg: "bg-red-50" },
    { icon: Star,        label: "Reviews Given",     value: 0,  color: "text-yellow-500", bg: "bg-yellow-50" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-8">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ""} width={56} height={56} className="rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center">
                <User className="w-7 h-7 text-brand-600" />
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl font-semibold text-neutral-900">
                Welcome back, {user.name?.split(" ")[0]}
              </h1>
              <p className="text-sm text-neutral-400">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-site py-8">
        {/* Quick nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Package,  label: "Orders",   href: "/dashboard/orders" },
            { icon: Heart,    label: "Wishlist", href: "/dashboard/wishlist" },
            { icon: User,     label: "Profile",  href: "/dashboard/profile" },
            { icon: MapPin,   label: "Addresses",href: "/dashboard/profile#addresses" },
          ].map(({ icon: Icon, label, href }) => (
            <Link key={href} href={href} className="bg-white rounded-xl border border-neutral-100 p-4 flex items-center gap-3 hover:border-brand-300 hover:shadow-brand-sm transition-all group">
              <div className="w-9 h-9 rounded-lg bg-neutral-50 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                <Icon className="w-5 h-5 text-neutral-500 group-hover:text-brand-600 transition-colors" />
              </div>
              <span className="text-sm font-medium text-neutral-700">{label}</span>
            </Link>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ icon: Icon, label, value, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-white rounded-xl border border-neutral-100 p-5"
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", bg)}>
                <Icon className={cn("w-5 h-5", color)} />
              </div>
              <p className="font-display text-2xl font-semibold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-neutral-900">Recent Orders</h2>
              <Link href="/dashboard/orders" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton rounded-lg" />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                <p className="text-sm text-neutral-400">No orders yet.</p>
                <Link href="/shop" className="btn-primary mt-4 text-xs py-2 px-4">Start Shopping</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Link
                    key={order._id}
                    href={`/dashboard/orders`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 font-mono">{order.orderNumber}</p>
                      <p className="text-xs text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-neutral-900">{formatPrice(order.total)}</p>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize", STATUS_COLORS[order.orderStatus] ?? "bg-neutral-50 text-neutral-500")}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Wishlist preview */}
          <div className="bg-white rounded-xl border border-neutral-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-neutral-900">Wishlist</h2>
              <Link href="/dashboard/wishlist" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                <p className="text-sm text-neutral-400">Your wishlist is empty.</p>
                <Link href="/shop" className="btn-secondary mt-4 text-xs py-2 px-4">Browse Products</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistItems.slice(0, 4).map((product) => (
                  <Link key={product._id} href={`/product/${product.slug}`} className="flex gap-3 hover:bg-neutral-50 p-2 rounded-lg transition-colors">
                    <div className="relative w-12 h-12 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                      {product.images?.[0]?.url && (
                        <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="48px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-800 line-clamp-2 leading-snug">{product.name}</p>
                      <p className="text-xs text-brand-600 font-semibold mt-0.5">{formatPrice(product.price)}</p>
                    </div>
                  </Link>
                ))}
                {wishlistItems.length > 4 && (
                  <p className="text-xs text-center text-neutral-400">+{wishlistItems.length - 4} more items</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
