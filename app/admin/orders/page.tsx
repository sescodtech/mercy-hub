"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ChevronDown, ChevronUp, Package,
  Clock, CheckCircle, Truck, XCircle, RefreshCw,
  Phone, MapPin, MessageCircle, Eye,
} from "lucide-react";
import axios from "axios";
import { formatPrice, formatDate, cn } from "@/utils";
import type { IOrder } from "@/types";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string; next?: string[] }> = {
  pending:    { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200",  icon: Clock,        label: "Pending",    next: ["confirmed", "cancelled"] },
  confirmed:  { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",      icon: CheckCircle,  label: "Confirmed",  next: ["processing", "cancelled"] },
  processing: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200",  icon: RefreshCw,    label: "Processing", next: ["shipped", "cancelled"] },
  shipped:    { color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200",  icon: Truck,        label: "Shipped",    next: ["delivered"] },
  delivered:  { color: "text-green-700",  bg: "bg-green-50 border-green-200",    icon: CheckCircle,  label: "Delivered",  next: [] },
  cancelled:  { color: "text-red-700",    bg: "bg-red-50 border-red-200",        icon: XCircle,      label: "Cancelled",  next: [] },
};

const ORDER_TIMELINE = [
  { status: "pending",    label: "Order Placed",   icon: Package },
  { status: "confirmed",  label: "Confirmed",      icon: CheckCircle },
  { status: "processing", label: "Processing",     icon: RefreshCw },
  { status: "shipped",    label: "Shipped",        icon: Truck },
  { status: "delivered",  label: "Delivered",      icon: CheckCircle },
];

const STATUS_ORDER = ["pending", "confirmed", "processing", "shipped", "delivered"];

function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
        <XCircle className="w-4 h-4 text-red-500" />
        <span className="text-sm text-red-700 font-medium">Order Cancelled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {ORDER_TIMELINE.map((step, i) => {
        const isCompleted = i <= currentIdx;
        const isCurrent   = i === currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.status} className="flex items-center">
            <div className={cn(
              "flex flex-col items-center gap-1 min-w-[70px]",
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                isCompleted
                  ? "bg-[#d98c2a] border-[#d98c2a] text-white"
                  : "bg-white border-neutral-200 text-neutral-300",
                isCurrent && "ring-2 ring-[#d98c2a] ring-offset-1"
              )}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={cn(
                "text-[10px] text-center leading-tight",
                isCompleted ? "text-[#d98c2a] font-medium" : "text-neutral-400"
              )}>
                {step.label}
              </span>
            </div>
            {i < ORDER_TIMELINE.length - 1 && (
              <div className={cn(
                "h-0.5 w-6 mx-1 flex-shrink-0 mb-4",
                i < currentIdx ? "bg-[#d98c2a]" : "bg-neutral-200"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter) params.set("status", statusFilter);
      if (search)       params.set("search", search);
      const { data } = await axios.get(`/api/admin/orders?${params.toString()}`);
      if (data.success) {
        setOrders(data.data);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string, trackingNumber?: string) => {
    setUpdating(orderId);
    try {
      await axios.patch(`/api/orders/${orderId}`, {
        orderStatus: status,
        ...(trackingNumber ? { trackingNumber } : {}),
      });

      // Send WhatsApp notification
      const order = orders.find((o) => o._id === orderId);
      if (order) {
        const addr = order.shippingAddress;
        if (addr?.phone) {
          await axios.post("/api/whatsapp", {
            type: "order_status",
            data: {
              customerName:  `${addr.firstName} ${addr.lastName}`,
              customerPhone: addr.phone,
              orderNumber:   order.orderNumber,
              total:         order.total,
              items:         order.items.map((i) => ({
                name:     (i.product as { name?: string })?.name ?? "Product",
                quantity: i.quantity,
                price:    i.price,
              })),
              status,
            },
          }).catch(() => {}); // silent if WhatsApp not configured
        }
      }

      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, orderStatus: status as IOrder["orderStatus"] } : o));
    } catch {
      alert("Failed to update order status");
    } finally {
      setUpdating(null);
    }
  };

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.orderStatus === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="bg-white border-b border-neutral-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Orders</h1>
            <p className="text-sm text-neutral-400">{total} total orders</p>
          </div>
          <Link href="/admin" className="text-sm text-[#d98c2a]">← Dashboard</Link>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          <button
            onClick={() => { setStatusFilter(""); setPage(1); }}
            className={cn("flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
              !statusFilter ? "bg-[#d98c2a] text-white border-[#d98c2a]" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
            )}
          >
            All ({total})
          </button>
          {Object.entries(STATUS_CONFIG).map(([s, config]) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn("flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize",
                statusFilter === s ? "bg-[#d98c2a] text-white border-[#d98c2a]" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
              )}
            >
              <config.icon className="w-3.5 h-3.5" />
              {config.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-4 max-w-6xl mx-auto">
        {/* Search */}
        <div className="bg-white rounded-xl border border-neutral-100 p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search order number…"
              className="pl-9 pr-4 py-2.5 text-sm rounded-lg border border-neutral-200 w-full outline-none focus:border-[#d98c2a]"
            />
          </div>
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl skeleton" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Package className="w-12 h-12 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-400">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusKey = order.orderStatus as string;
              const config = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              const isExpanded = expanded === order._id;

              return (
                <motion.div
                  key={order._id}
                  layout
                  className="bg-white rounded-xl border border-neutral-100 overflow-hidden"
                >
                  {/* Order header row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : order._id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-neutral-400" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-semibold text-neutral-900">{order.orderNumber}</p>
                        <p className="text-xs text-neutral-400">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block text-right">
                        <p className="font-semibold text-neutral-900">{formatPrice(order.total)}</p>
                        <p className="text-xs text-neutral-400 capitalize">{order.paymentMethod}</p>
                      </div>
                      <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border capitalize", config.color, config.bg)}>
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-neutral-100 overflow-hidden"
                      >
                        <div className="p-5 space-y-5">

                          {/* Timeline */}
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">Order Timeline</p>
                            <OrderTimeline currentStatus={order.orderStatus} />
                          </div>

                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {/* Items */}
                            <div className="lg:col-span-1">
                              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">Items ({order.items.length})</p>
                              <div className="space-y-2">
                                {order.items.map((item, i) => {
                                  const p = item.product as { name?: string; images?: { url: string }[] };
                                  return (
                                    <div key={i} className="flex gap-2 items-center">
                                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                                        {p.images?.[0]?.url && (
                                          <Image src={p.images[0].url} alt={p.name ?? ""} fill className="object-cover" sizes="40px" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-neutral-800 truncate">{p.name}</p>
                                        <p className="text-xs text-neutral-400">×{item.quantity} · {formatPrice(item.total)}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Customer & Address */}
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">Customer</p>
                              <div className="space-y-2 text-sm text-neutral-700">
                                <div className="flex items-center gap-2">
                                  <Package className="w-3.5 h-3.5 text-neutral-400" />
                                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                  {order.shippingAddress.phone}
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5" />
                                  <span className="text-xs">
                                    {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-3">Actions</p>
                              <div className="space-y-2">
                                {/* Status update */}
                                <div>
                                  <label className="text-xs text-neutral-500 mb-1 block">Update Status</label>
                                  <select
                                    value={order.orderStatus}
                                    onChange={(e) => updateStatus(order._id, e.target.value)}
                                    disabled={updating === order._id}
                                    className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-[#d98c2a] cursor-pointer"
                                  >
                                    {Object.entries(STATUS_CONFIG).map(([s, c]) => (
                                      <option key={s} value={s}>{c.label}</option>
                                    ))}
                                  </select>
                                </div>

                                {/* Tracking number */}
                                <div>
                                  <label className="text-xs text-neutral-500 mb-1 block">Tracking Number</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={trackingInputs[order._id] ?? order.trackingNumber ?? ""}
                                      onChange={(e) => setTrackingInputs((t) => ({ ...t, [order._id]: e.target.value }))}
                                      placeholder="Enter tracking #"
                                      className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-[#d98c2a]"
                                    />
                                    <button
                                      onClick={() => updateStatus(order._id, order.orderStatus, trackingInputs[order._id])}
                                      className="px-3 py-2 bg-[#d98c2a] text-white text-xs rounded-lg hover:bg-[#c47020] transition-colors"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>

                                {/* WhatsApp notify */}
                                <button
                                  onClick={async () => {
                                    const addr = order.shippingAddress;
                                    await axios.post("/api/whatsapp", {
                                      type: "order_status",
                                      data: {
                                        customerName: `${addr.firstName} ${addr.lastName}`,
                                        customerPhone: addr.phone,
                                        orderNumber: order.orderNumber,
                                        total: order.total,
                                        items: order.items.map((i) => ({
                                          name: (i.product as { name?: string })?.name ?? "Product",
                                          quantity: i.quantity,
                                          price: i.price,
                                        })),
                                        status: order.orderStatus,
                                      },
                                    });
                                    alert("WhatsApp notification sent!");
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Send WhatsApp Update
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Order totals */}
                          <div className="border-t border-neutral-100 pt-4 grid grid-cols-4 gap-4 text-center text-sm">
                            <div>
                              <p className="text-neutral-400 text-xs">Subtotal</p>
                              <p className="font-semibold">{formatPrice(order.subtotal)}</p>
                            </div>
                            <div>
                              <p className="text-neutral-400 text-xs">Shipping</p>
                              <p className="font-semibold">{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</p>
                            </div>
                            <div>
                              <p className="text-neutral-400 text-xs">Discount</p>
                              <p className="font-semibold text-green-600">{order.discount > 0 ? `-${formatPrice(order.discount)}` : "—"}</p>
                            </div>
                            <div>
                              <p className="text-neutral-400 text-xs">Total</p>
                              <p className="font-bold text-base">{formatPrice(order.total)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {Math.ceil(total / 15) > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(total / 15) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn("w-10 h-10 rounded-lg text-sm font-medium transition-all",
                  p === page ? "bg-[#d98c2a] text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-[#d98c2a]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
