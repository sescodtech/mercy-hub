"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Loader2, Tag, Lock } from "lucide-react";
import { useCartStore } from "@/hooks/useCart";
import { formatPrice, calculateShipping } from "@/utils";
import { cn } from "@/utils";
import axios from "axios";
import toast from "react-hot-toast";

type PayMethod = "paystack" | "flutterwave" | "cod";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getSubtotal, clearCart } = useCartStore();
  const subtotal = getSubtotal();
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;

  const [step, setStep] = useState<"address" | "payment">("address");
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState<PayMethod>("paystack");

  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: session?.user?.email ?? "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "Nigeria",
  });

  const finalTotal = total - discount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const { data } = await axios.post("/api/coupons/validate", {
        code: couponCode,
        orderAmount: subtotal,
      });
      if (data.success) {
        setDiscount(data.data.discount);
        toast.success(`Coupon applied! You save ${formatPrice(data.data.discount)}`);
      }
    } catch {
      toast.error("Invalid or expired coupon code.");
    }
  };

  const initializePaystack = async (orderId: string, email: string, amount: number) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    document.body.appendChild(script);
    script.onload = () => {
      const handler = (window as unknown as { PaystackPop: { setup: (config: unknown) => { openIframe: () => void } } }).PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
        email,
        amount: amount * 100,
        currency: "NGN",
        ref: `MHE-${Date.now()}`,
        onSuccess: async (transaction: { reference: string }) => {
          await axios.patch(`/api/orders/${orderId}`, {
            paymentStatus: "paid",
            paymentReference: transaction.reference,
            orderStatus: "confirmed",
          });
          clearCart();
          router.push(`/dashboard/orders`);
          toast.success("Payment successful! Order confirmed.");
        },
        onCancel: () => toast.error("Payment cancelled."),
      });
      handler.openIframe();
    };
  };

  const placeOrder = async () => {
    const required = ["firstName", "lastName", "phone", "email", "addressLine1", "city", "state"];
    const missing = required.filter((k) => !address[k as keyof typeof address]);
    if (missing.length > 0) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/orders", {
        items: items.map((i) => ({
          product: i.product._id,
          variant: i.variant ? { name: i.variant.name, value: i.variant.value } : undefined,
          quantity: i.quantity,
          price: i.variant?.price ?? i.product.price,
          total: (i.variant?.price ?? i.product.price) * i.quantity,
        })),
        shippingAddress: address,
        paymentMethod: payMethod,
        subtotal,
        shippingCost: shipping,
        discount,
        tax: 0,
        total: finalTotal,
        coupon: couponCode ? { code: couponCode, discount, type: "fixed" } : undefined,
      });

      if (data.success) {
        const orderId = data.data._id;
        if (payMethod === "paystack") {
          await initializePaystack(orderId, address.email, finalTotal);
        } else if (payMethod === "cod") {
          clearCart();
          router.push(`/dashboard/orders`);
          toast.success("Order placed! Pay on delivery.");
        } else {
          toast.error("Flutterwave coming soon. Please use Paystack or Cash on Delivery.");
        }
      }
    } catch {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl text-neutral-700 mb-4">Your cart is empty</h2>
          <Link href="/shop" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <span className="font-display text-xl font-semibold text-ebony">
                Mercy<span className="text-brand-500">Home</span>
              </span>
            </Link>
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => setStep("address")} className={cn("font-medium transition-colors", step === "address" ? "text-brand-600" : "text-neutral-400")}>
                Address
              </button>
              <ChevronRight className="w-4 h-4 text-neutral-300" />
              <button className={cn("font-medium transition-colors", step === "payment" ? "text-brand-600" : "text-neutral-400")}>
                Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-site py-10">
        <div className="grid lg:grid-cols-[1fr_400px] gap-10">
          <div>
            <AnimatePresence mode="wait">
              {step === "address" && (
                <motion.div key="address" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-6">Shipping Address</h2>
                  <div className="bg-white rounded-2xl p-6 space-y-4 shadow-sm">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">First Name *</label>
                        <input type="text" value={address.firstName} onChange={(e) => setAddress((a) => ({ ...a, firstName: e.target.value }))} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">Last Name *</label>
                        <input type="text" value={address.lastName} onChange={(e) => setAddress((a) => ({ ...a, lastName: e.target.value }))} className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Email *</label>
                      <input type="email" value={address.email} onChange={(e) => setAddress((a) => ({ ...a, email: e.target.value }))} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Phone *</label>
                      <input type="tel" value={address.phone} onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Address *</label>
                      <input type="text" value={address.addressLine1} onChange={(e) => setAddress((a) => ({ ...a, addressLine1: e.target.value }))} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">Apt, suite, etc</label>
                      <input type="text" value={address.addressLine2} onChange={(e) => setAddress((a) => ({ ...a, addressLine2: e.target.value }))} className="input-field" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">City *</label>
                        <input type="text" value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1.5">State *</label>
                        <input type="text" value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} className="input-field" />
                      </div>
                    </div>
                    <button onClick={() => setStep("payment")} className="btn-primary w-full justify-center py-4 mt-2">
                      Continue to Payment <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-6">Payment Method</h2>
                  <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                    {(["paystack", "flutterwave", "cod"] as PayMethod[]).map((method) => (
                      <label key={method} className={cn("flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all", payMethod === method ? "border-brand-500 bg-brand-50" : "border-neutral-200 hover:border-neutral-300")}>
                        <input type="radio" name="payment" value={method} checked={payMethod === method} onChange={() => setPayMethod(method)} className="accent-brand-600" />
                        <div>
                          <p className="font-medium text-sm text-neutral-900">
                            {method === "cod" ? "Cash on Delivery" : method === "paystack" ? "Paystack" : "Flutterwave"}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {method === "paystack" && "Visa, Mastercard, Bank Transfer, USSD"}
                            {method === "flutterwave" && "Cards, Bank, Mobile Money"}
                            {method === "cod" && "Pay when your order arrives"}
                          </p>
                        </div>
                      </label>
                    ))}
                    <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                      Your payment is secured with 256-bit SSL encryption.
                    </div>
                    <button onClick={placeOrder} disabled={loading} className="btn-primary w-full justify-center py-4">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : `Place Order · ${formatPrice(finalTotal)}`}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-neutral-900 mb-5">Order Summary</h2>
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                {items.map((item) => {
                  const price = item.variant?.price ?? item.product.price;
                  const image = item.product.images?.[0]?.url;
                  return (
                    <div key={`${item.product._id}-${item.variant?.value}`} className="flex gap-3">
                      <div className="relative w-14 h-14 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                        {image && <Image src={image} alt={item.product.name} fill className="object-cover" sizes="56px" />}
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-700 text-white text-[9px] rounded-full flex items-center justify-center font-medium">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{item.product.name}</p>
                        {item.variant && <p className="text-xs text-neutral-400">{item.variant.value}</p>}
                      </div>
                      <p className="text-sm font-medium text-neutral-900 flex-shrink-0">{formatPrice(price * item.quantity)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-neutral-100 pt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="input-field pl-9 py-2.5" />
                  </div>
                  <button onClick={applyCoupon} className="btn-secondary px-4 py-2.5 text-xs flex-shrink-0">Apply</button>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : formatPrice(shipping)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span><span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base text-neutral-900 pt-2 border-t border-neutral-100">
                  <span>Total</span>
                  <span className="font-display text-xl">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
