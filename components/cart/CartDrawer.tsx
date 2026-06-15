"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck, Info } from "lucide-react";
import { useCartStore } from "@/hooks/useCart";
import { useSettings } from "@/hooks/useSettings";
import { formatPrice } from "@/utils";

export function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const { settings } = useSettings();
  const subtotal = getSubtotal();

  // ── All shipping values from DB — no hardcoded fallbacks ──
  const shippingEnabled       = settings?.shipping?.enabled ?? true;
  const freeShippingEnabled   = settings?.shipping?.freeShippingEnabled ?? true;
  const freeShippingThreshold = settings?.shipping?.freeShippingThreshold ?? 100000;
  const defaultShippingCost   = settings?.shipping?.defaultShippingCost ?? 3000;

  // Determine shipping status
  const isFreeByRule     = freeShippingEnabled && subtotal >= freeShippingThreshold;
  const shippingDisabled = !shippingEnabled;
  const shippingUnknown  = shippingEnabled && !freeShippingEnabled; // admin turned off auto-free
  const remaining        = Math.max(0, freeShippingThreshold - subtotal);

  const shippingLabel = () => {
    if (!settings) return "Calculated at checkout";
    if (shippingDisabled) return "Free";
    if (isFreeByRule)     return "Free 🎉";
    if (shippingUnknown)  return "Confirmed on delivery";
    return "Calculated at checkout";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full z-50 w-full max-w-md bg-white shadow-luxury flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-brand-600" />
                <h2 className="font-display text-xl font-semibold text-neutral-900">Your Cart</h2>
                {items.length > 0 && (
                  <span className="badge badge-trending">
                    {items.length} item{items.length !== 1 && "s"}
                  </span>
                )}
              </div>
              <button onClick={closeCart} className="btn-icon" aria-label="Close cart">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free shipping progress bar */}
            {freeShippingEnabled && !isFreeByRule && subtotal > 0 && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
                <p className="text-xs text-amber-800 font-medium mb-1.5">
                  Add <strong>{formatPrice(remaining)}</strong> more for free delivery!
                </p>
                <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Free shipping achieved */}
            {isFreeByRule && (
              <div className="px-5 py-2.5 bg-green-50 border-b border-green-100">
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-green-600" />
                  <p className="text-xs text-green-700 font-medium">
                    🎉 You qualify for free delivery!
                  </p>
                </div>
              </div>
            )}

            {/* Shipping unknown notice */}
            {shippingUnknown && subtotal > 0 && (
              <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-neutral-500">
                    Shipping cost will be confirmed by our team after your order.
                  </p>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-neutral-300" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-neutral-700 mb-1">Your cart is empty</p>
                    <p className="text-neutral-400 text-sm">Add some beautiful pieces to get started</p>
                  </div>
                  <button onClick={closeCart} className="btn-primary mt-2">Browse Products</button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const price = item.variant?.price ?? item.product.price;
                    const image = item.product.images?.[0]?.url;
                    const key   = item.variant
                      ? `${item.product._id}-${item.variant.value}`
                      : item.product._id;

                    return (
                      <motion.div
                        key={key}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-3 py-4 border-b border-neutral-100 last:border-0"
                      >
                        <div className="relative w-18 h-18 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100"
                          style={{ width: 72, height: 72 }}>
                          {image && (
                            <Image src={image} alt={item.product.name} fill className="object-cover" sizes="72px" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/product/${item.product.slug}`}
                            onClick={closeCart}
                            className="text-sm font-medium text-neutral-900 line-clamp-2 block hover:text-brand-600 transition-colors leading-snug"
                          >
                            {item.product.name}
                          </Link>

                          {item.variant && (
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {item.variant.name}: {item.variant.value}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2.5">
                            <div className="flex items-center gap-1 border border-neutral-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.variant?.value)}
                                className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-50"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-sm font-semibold text-neutral-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.variant?.value)}
                                className="w-7 h-7 flex items-center justify-center text-neutral-500 hover:bg-neutral-50"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-neutral-900">
                                {formatPrice(price * item.quantity)}
                              </span>
                              <button
                                onClick={() => removeItem(item.product._id, item.variant?.value)}
                                className="text-neutral-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer summary */}
            {items.length > 0 && (
              <div className="border-t border-neutral-100 px-5 py-5 space-y-4 bg-neutral-50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-neutral-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Shipping</span>
                    <span className={
                      isFreeByRule || shippingDisabled
                        ? "text-green-600 font-semibold"
                        : shippingUnknown
                        ? "text-amber-600 font-medium text-xs"
                        : "text-neutral-500"
                    }>
                      {shippingLabel()}
                    </span>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-neutral-200">
                    <span className="font-bold text-neutral-900">Estimated Total</span>
                    <span className="font-bold text-lg text-neutral-900">
                      {isFreeByRule || shippingDisabled
                        ? formatPrice(subtotal)
                        : shippingUnknown
                        ? `${formatPrice(subtotal)} + shipping`
                        : formatPrice(subtotal)}
                    </span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="btn-primary w-full justify-center group"
                >
                  Checkout
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="btn-secondary w-full justify-center text-xs"
                >
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
