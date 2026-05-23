"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X } from "lucide-react";
import { useCartStore } from "@/hooks/useCart";
import { formatPrice, calculateShipping } from "@/utils";
import { cn } from "@/utils";
import axios from "axios";
import toast from "react-hot-toast";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore();
  const subtotal = getSubtotal();
  const shipping = calculateShipping(subtotal);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState("");

  const total = subtotal + shipping - discount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await axios.post("/api/coupons/validate", {
        code: couponCode,
        orderAmount: subtotal,
      });
      if (data.success) {
        setDiscount(data.data.discount);
        setAppliedCoupon(couponCode.toUpperCase());
        toast.success(`Coupon applied! You save ${formatPrice(data.data.discount)}`);
      }
    } catch {
      toast.error("Invalid or expired coupon code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedCoupon("");
    setCouponCode("");
    toast.success("Coupon removed.");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-9 h-9 text-neutral-400" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-neutral-800 mb-2">
            Your cart is empty
          </h2>
          <p className="text-neutral-500 text-sm mb-8">
            Looks like you haven&apos;t added anything yet. Browse our collection to find something you love.
          </p>
          <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-5">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-semibold text-neutral-900">
              Your Cart
            </h1>
            <span className="text-sm text-neutral-400">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      </div>

      <div className="container-site py-10">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
          {/* Cart Items */}
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item) => {
                const price = item.variant?.price ?? item.product.price;
                const image = item.product.images?.[0]?.url;

                return (
                  <motion.div
                    key={`${item.product._id}-${item.variant?.value ?? "default"}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30, transition: { duration: 0.2 } }}
                    className="bg-white rounded-2xl p-4 shadow-sm flex gap-4"
                  >
                    {/* Product Image — clicking goes to product page */}
                    <Link
                      href={`/product/${item.product.slug}`}
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 group"
                    >
                      {image ? (
                        <Image
                          src={image}
                          alt={item.product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-neutral-300" />
                        </div>
                      )}
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/product/${item.product.slug}`}
                            className="font-medium text-neutral-900 text-sm sm:text-base truncate block hover:text-brand-600 transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          {item.variant && (
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {item.variant.name}: {item.variant.value}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-brand-600 mt-1">
                            {formatPrice(price)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.product._id, item.variant?.value)}
                          className="text-neutral-300 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quantity + Line Total */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 border border-neutral-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              item.quantity === 1
                                ? removeItem(item.product._id, item.variant?.value)
                                : updateQuantity(item.product._id, item.variant?.value, item.quantity - 1)
                            }
                            className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product._id, item.variant?.value, item.quantity + 1)
                            }
                            className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {formatPrice(price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Clear cart */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  clearCart();
                  toast.success("Cart cleared.");
                }}
                className="text-xs text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="sticky top-24">
            <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">
              Order Summary
            </h2>
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
              {/* Coupon */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{appliedCoupon}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-green-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        placeholder="Coupon code"
                        className="input-field pl-9 py-2.5 text-sm"
                      />
                    </div>
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="btn-secondary px-4 py-2.5 text-xs flex-shrink-0 disabled:opacity-50"
                    >
                      {couponLoading ? "…" : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-100 pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-medium">Free</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                {shipping > 0 && (
                  <p className="text-xs text-neutral-400">
                    Free shipping on orders over ₦50,000
                  </p>
                )}
                <div className="flex justify-between font-semibold text-base text-neutral-900 pt-2 border-t border-neutral-100">
                  <span>Total</span>
                  <span className="font-display text-xl">{formatPrice(total)}</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => router.push("/checkout")}
                className="btn-primary w-full justify-center py-4"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/shop"
                className="block text-center text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
