"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Package, ChevronDown, ChevronUp, ExternalLink, Clock } from "lucide-react";
import axios from "axios";
import { formatPrice, formatDate, cn } from "@/utils";
import type { IOrder } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  shipped:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered:  "bg-green-50 text-green-700 border-green-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STYLES: Record<string, string> = {
  pending:  "text-yellow-600",
  paid:     "text-green-600",
  failed:   "text-red-600",
  refunded: "text-purple-600",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    axios.get("/api/orders")
      .then(({ data }) => { if (data.success) setOrders(data.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-8">
          <h1 className="font-display text-2xl font-semibold text-neutral-900">My Orders</h1>
          <p className="text-sm text-neutral-400 mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="container-site py-8 max-w-4xl">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
            <p className="font-display text-xl text-neutral-500 mb-6">No orders yet</p>
            <Link href="/shop" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-neutral-100 overflow-hidden"
              >
                {/* Header */}
                <button
                  onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-neutral-900">{order.orderNumber}</p>
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold text-neutral-900">{formatPrice(order.total)}</p>
                      <p className={cn("text-xs font-medium capitalize", PAYMENT_STYLES[order.paymentStatus])}>
                        {order.paymentStatus}
                      </p>
                    </div>
                    <span className={cn("text-xs font-medium px-3 py-1 rounded-full border capitalize", STATUS_STYLES[order.orderStatus] ?? "bg-neutral-50 text-neutral-500 border-neutral-200")}>
                      {order.orderStatus}
                    </span>
                    {expanded === order._id
                      ? <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    }
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === order._id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    className="border-t border-neutral-100"
                  >
                    <div className="p-5 space-y-4">
                      {/* Items */}
                      <div className="space-y-3">
                        {order.items.map((item, j) => {
                          const p = item.product as { name?: string; slug?: string; images?: { url: string }[] };
                          return (
                            <div key={j} className="flex gap-3 items-center">
                              <div className="relative w-14 h-14 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                                {p.images?.[0]?.url && (
                                  <Image src={p.images[0].url} alt={p.name ?? ""} fill className="object-cover" sizes="56px" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-neutral-800">{p.name}</p>
                                {item.variant && (
                                  <p className="text-xs text-neutral-400">{item.variant.name}: {item.variant.value}</p>
                                )}
                                <p className="text-xs text-neutral-400">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-sm font-semibold text-neutral-900">{formatPrice(item.total)}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Totals */}
                      <div className="border-t border-neutral-100 pt-4 space-y-1.5 text-sm">
                        <div className="flex justify-between text-neutral-500">
                          <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-500">
                          <span>Shipping</span>
                          <span>{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</span>
                        </div>
                        {order.discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span><span>-{formatPrice(order.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold text-neutral-900 pt-1 border-t border-neutral-100">
                          <span>Total</span><span>{formatPrice(order.total)}</span>
                        </div>
                      </div>

                      {/* Tracking */}
                      {order.trackingNumber && (
                        <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-blue-700">Tracking Number</p>
                            <p className="font-mono text-sm text-blue-900">{order.trackingNumber}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-blue-500" />
                        </div>
                      )}

                      {/* Shipping address */}
                      <div className="bg-neutral-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-neutral-500 mb-1">Shipping To</p>
                        <p className="text-sm text-neutral-700">
                          {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                          {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
