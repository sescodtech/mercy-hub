"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag, Clock, CheckCircle, Truck, XCircle,
  RefreshCw, ChevronRight, Package, Loader2,
} from "lucide-react";
import axios from "axios";
import { formatPrice, cn } from "@/utils";

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string; bg: string }> = {
  pending:    { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: Clock,       label: "Pending" },
  confirmed:  { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: CheckCircle, label: "Confirmed" },
  processing: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: RefreshCw,   label: "Processing" },
  shipped:    { color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: Truck,       label: "Shipped" },
  delivered:  { color: "text-green-700",  bg: "bg-green-50 border-green-200",   icon: CheckCircle, label: "Delivered" },
  cancelled:  { color: "text-red-700",    bg: "bg-red-50 border-red-200",       icon: XCircle,     label: "Cancelled" },
};

interface Order {
  _id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  items: { product: { name: string; images: { url: string }[] }; quantity: number; price: number; total: number }[];
  total: number;
  shippingAddress: { firstName: string; lastName: string; city: string; state: string };
  createdAt: string;
  trackingNumber?: string;
}

function OrdersContent() {
  const { data: session, status } = useSession();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const successOrder = searchParams.get("order");

  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [expanded, setExpanded] = useState<string | null>(successOrder ?? null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login?callbackUrl=/dashboard/orders");
  }, [status, router]);

  const load = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (filter !== "all") params.set("status", filter);
      const { data } = await axios.get(`/api/user/orders?${params}`);
      if (data.success) setOrders(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [status, filter]);

  useEffect(() => { load(); }, [load]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-neutral-900">My Orders</h1>
              <p className="text-sm text-neutral-400 mt-0.5">{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>
            </div>
            <Link href="/shop" className="text-sm text-[#d98c2a] hover:underline">Continue Shopping</Link>
          </div>
        </div>
      </div>

      <div className="container-site py-8 max-w-4xl">

        {/* Success banner */}
        {searchParams.get("success") && successOrder && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Order placed successfully!</p>
              <p className="text-xs text-green-600 mt-0.5">Order #{successOrder} — You'll receive a confirmation shortly.</p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex-shrink-0",
                filter === f ? "bg-[#d98c2a] text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}>
              {f === "all" ? "All Orders" : STATUS_CONFIG[f]?.label ?? f}
            </button>
          ))}
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 py-16 text-center">
            <ShoppingBag className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-neutral-700 mb-2">No orders yet</h3>
            <p className="text-neutral-400 text-sm mb-6">When you place orders, they'll appear here.</p>
            <Link href="/shop" className="px-6 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_CONFIG[order.orderStatus] ?? STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const isExpanded = expanded === order._id;

              return (
                <div key={order._id} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                  {/* Order header */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : order._id)}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">#{order.orderNumber}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className={cn("hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border", status.bg, status.color)}>
                        <StatusIcon className="w-3 h-3" />{status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-neutral-900">{formatPrice(order.total)}</p>
                      <ChevronRight className={cn("w-4 h-4 text-neutral-400 transition-transform", isExpanded && "rotate-90")} />
                    </div>
                  </div>

                  {/* Order details (expanded) */}
                  {isExpanded && (
                    <div className="border-t border-neutral-100 px-5 py-5 space-y-5">
                      {/* Status timeline */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {["pending", "confirmed", "processing", "shipped", "delivered"].map((s, i, arr) => {
                          const statusOrder = ["pending","confirmed","processing","shipped","delivered"];
                          const currentIdx  = statusOrder.indexOf(order.orderStatus);
                          const thisIdx     = statusOrder.indexOf(s);
                          const isDone      = thisIdx <= currentIdx && order.orderStatus !== "cancelled";
                          const isCurrent   = s === order.orderStatus;
                          const cfg         = STATUS_CONFIG[s];
                          const Ic          = cfg.icon;
                          return (
                            <div key={s} className="flex items-center gap-2 flex-shrink-0">
                              <div className={cn("flex flex-col items-center gap-1")}>
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                                  isDone ? "bg-[#d98c2a] border-[#d98c2a] text-white" : "border-neutral-200 text-neutral-300"
                                )}>
                                  <Ic className="w-3.5 h-3.5" />
                                </div>
                                <span className={cn("text-[10px] font-medium", isCurrent ? "text-[#d98c2a]" : isDone ? "text-neutral-600" : "text-neutral-300")}>
                                  {cfg.label}
                                </span>
                              </div>
                              {i < arr.length - 1 && (
                                <div className={cn("w-8 h-0.5 flex-shrink-0 mb-4", isDone && statusOrder.indexOf(arr[i+1]) <= currentIdx ? "bg-[#d98c2a]" : "bg-neutral-200")} />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {order.items.map((item, i) => {
                          const img = item.product?.images?.[0]?.url;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                                {img
                                  ? <Image src={img} alt={item.product.name} width={48} height={48} className="object-cover w-full h-full" />
                                  : <Package className="w-5 h-5 text-neutral-300 m-auto mt-3.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-800 truncate">{item.product?.name}</p>
                                <p className="text-xs text-neutral-400">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                              </div>
                              <p className="text-sm font-semibold text-neutral-900">{formatPrice(item.total)}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Delivery info */}
                      <div className="pt-3 border-t border-neutral-100 flex flex-wrap gap-4 text-xs text-neutral-500">
                        <span>
                          <strong className="text-neutral-700">Deliver to:</strong>{" "}
                          {order.shippingAddress.firstName} {order.shippingAddress.lastName}, {order.shippingAddress.city}, {order.shippingAddress.state}
                        </span>
                        {order.trackingNumber && (
                          <span><strong className="text-neutral-700">Tracking:</strong> {order.trackingNumber}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardOrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" />
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}
