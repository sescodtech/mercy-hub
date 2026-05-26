"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCartStore } from "@/hooks/useCart";
import { formatPrice } from "@/utils";

export function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const shipping = 0;
  const freeShippingThreshold = 50000;
  const remaining = freeShippingThreshold - subtotal;

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
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-brand-600" />
                <h2 className="font-display text-xl font-semibold text-neutral-900">
                  Your Cart
                </h2>
                {items.length > 0 && (
                  <span className="badge badge-trending">{items.length} item{items.length !== 1 && "s"}</span>
                )}
              </div>
              <button onClick={closeCart} className="btn-icon" aria-label="Close cart">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free shipping progress */}
            {subtotal < freeShippingThreshold && subtotal > 0 && (
              <div className="px-6 py-3 bg-brand-50 border-b border-brand-100">
                <p className="text-xs text-brand-700 mb-1.5">
                  Add <strong>{formatPrice(remaining)}</strong> more for free shipping!
                </p>
                <div className="h-1 bg-brand-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
                    className="h-full bg-brand-500 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-neutral-300" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-neutral-700 mb-1">Your cart is empty</p>
                    <p className="text-sm text-neutral-400">Add some beautiful pieces to get started</p>
                  </div>
                  <button onClick={closeCart} className="btn-primary mt-2">
                    Browse Products
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((item) => {
                    const price = item.variant?.price ?? item.product.price;
                    const image = item.product.images?.[0]?.url;
                    const key = item.variant
                      ? `${item.product._id}-${item.variant.value}`
                      : item.product._id;

                    return (
                      <motion.div
                        key={key}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4 py-4 border-b border-neutral-100 last:border-0"
                      >
                        {/* Image */}
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-neutral-100">
                          {image && (
                            <Image
                              src={image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/product/${item.product.slug}`}
                            onClick={closeCart}
                            className="text-sm font-medium text-neutral-900 hover:text-brand-600 line-clamp-2 leading-snug"
                          >
                            {item.product.name}
                          </Link>
                          {item.variant && (
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {item.variant.name}: {item.variant.value}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            {/* Quantity */}
                            <div className="flex items-center gap-1 border border-neutral-200 rounded-sm">
                              <button
                                onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.variant?.value)}
                                className="p-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.variant?.value)}
                                className="p-1.5 text-neutral-500 hover:text-neutral-900 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="price-current text-base">{formatPrice(price * item.quantity)}</span>
                              <button
                                onClick={() => removeItem(item.product._id, item.variant?.value)}
                                className="text-neutral-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-neutral-100 px-6 py-5 space-y-4 bg-neutral-50">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping</span>
                    <span className="font-medium text-neutral-900">
                      Calculated at checkout
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-neutral-900 pt-2 border-t border-neutral-200">
                    <span>Total</span>
                    <span className="font-display text-lg">{formatPrice(subtotal)}</span>
                  </div>
                </div>
                <Link href="/checkout" onClick={closeCart} className="btn-primary w-full justify-center group">
                  Checkout
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/cart" onClick={closeCart} className="btn-secondary w-full justify-center text-xs">
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
