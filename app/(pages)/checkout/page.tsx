"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight, ShoppingBag, MapPin, CreditCard,
  Tag, Truck, Loader2, CheckCircle, AlertCircle, X,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useCartStore } from "@/hooks/useCart";
import { formatPrice, cn } from "@/utils";

type Step = "address" | "shipping" | "payment";
type PaymentMethod = "paystack" | "flutterwave" | "cod";

interface ShippingOption {
  cost: number;
  label: string;
  estimatedDays: string;
  isFree: boolean;
}

interface Address {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

const EMPTY_ADDRESS: Address = {
  firstName: "", lastName: "", phone: "",
  addressLine1: "", addressLine2: "",
  city: "", state: "", country: "Nigeria", postalCode: "",
};

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue",
  "Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja",
  "Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara",
  "Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers",
  "Sokoto","Taraba","Yobe","Zamfara",
];

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", disabled }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type} value={value} disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors disabled:bg-neutral-50 disabled:text-neutral-400"
    />
  );
}

export default function CheckoutPage() {
  const router  = useRouter();
  const { data: session, status } = useSession();
  const { items, getSubtotal, clearCart } = useCartStore();

  const [step,          setStep]          = useState<Step>("address");
  const [address,       setAddress]       = useState<Address>(EMPTY_ADDRESS);
  const [shipping,      setShipping]      = useState<ShippingOption | null>(null);
  const [loadingShip,   setLoadingShip]   = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [couponCode,    setCouponCode]    = useState("");
  const [discount,      setDiscount]      = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing,       setPlacing]       = useState(false);

  const subtotal = getSubtotal();
  const shippingCost = shipping?.cost ?? 0;
  const total = subtotal + shippingCost - discount;

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=/checkout`);
    }
  }, [status, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (status !== "loading" && items.length === 0) {
      router.push("/cart");
    }
  }, [items, status, router]);

  // Calculate shipping when state changes
  const calculateShipping = useCallback(async (state: string) => {
    if (!state) return;
    setLoadingShip(true);
    try {
      const { data } = await axios.post("/api/shipping/calculate", {
        state,
        orderTotal: subtotal,
      });
      if (data.success) setShipping(data.data);
    } catch {
      // Fallback shipping
      setShipping({ cost: 2500, label: "Standard Delivery", estimatedDays: "3-7 days", isFree: false });
    } finally {
      setLoadingShip(false);
    }
  }, [subtotal]);

  useEffect(() => {
    if (address.state) calculateShipping(address.state);
  }, [address.state, calculateShipping]);

  const set = (key: keyof Address, val: string) =>
    setAddress((a) => ({ ...a, [key]: val }));

  const validateAddress = () => {
    const required: (keyof Address)[] = ["firstName", "lastName", "phone", "addressLine1", "city", "state"];
    for (const field of required) {
      if (!address[field].trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        return false;
      }
    }
    if (address.phone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await axios.post("/api/coupons/validate", {
        code: couponCode, orderAmount: subtotal,
      });
      if (data.success) {
        setDiscount(data.data.discount);
        setAppliedCoupon(couponCode.toUpperCase());
        toast.success(`Coupon applied! You save ${formatPrice(data.data.discount)}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Invalid or expired coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!session?.user) { router.push("/auth/login?callbackUrl=/checkout"); return; }
    setPlacing(true);
    try {
      const { data } = await axios.post("/api/orders", {
        items: items.map((item) => ({
          product:  item.product._id,
          variant:  item.variant ? { name: item.variant.name, value: item.variant.value } : undefined,
          quantity: item.quantity,
          price:    item.variant?.price ?? item.product.price,
          total:    (item.variant?.price ?? item.product.price) * item.quantity,
        })),
        shippingAddress: address,
        paymentMethod,
        subtotal,
        shippingCost,
        discount,
        total,
        coupon: appliedCoupon ? { code: appliedCoupon, discount } : undefined,
      });

      if (!data.success) throw new Error(data.error);

      // Handle payment
      if (paymentMethod === "cod") {
        clearCart();
        router.push(`/dashboard/orders?success=true&order=${data.data.orderNumber}`);
        return;
      }

      if (paymentMethod === "paystack") {
        const paystackRes = await axios.post("/api/payments/paystack/initialize", {
          email:     session.user.email,
          amount:    total,
          orderId:   data.data._id,
          reference: data.data.orderNumber,
        });
        if (paystackRes.data.success) {
          window.location.href = paystackRes.data.data.authorization_url;
        }
        return;
      }

      if (paymentMethod === "flutterwave") {
        const flwRes = await axios.post("/api/payments/flutterwave/initialize", {
          email:    session.user.email,
          amount:   total,
          orderId:  data.data._id,
          name:     `${address.firstName} ${address.lastName}`,
          phone:    address.phone,
        });
        if (flwRes.data.success) {
          window.location.href = flwRes.data.data.link;
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" />
      </div>
    );
  }

  // Guard — don't render if redirecting
  if (status === "unauthenticated" || items.length === 0) return null;

  const steps: { id: Step; label: string }[] = [
    { id: "address",  label: "Delivery" },
    { id: "shipping", label: "Shipping" },
    { id: "payment",  label: "Payment" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-semibold text-neutral-900">
            Mercy<span className="text-[#d98c2a]">Home</span>
          </Link>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const stepOrder = { address: 0, shipping: 1, payment: 2 };
              const currentOrder = stepOrder[step];
              const thisOrder = stepOrder[s.id];
              const isDone    = thisOrder < currentOrder;
              const isCurrent = s.id === step;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-medium",
                    isCurrent ? "text-[#d98c2a]" : isDone ? "text-green-600" : "text-neutral-400"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      isCurrent ? "bg-[#d98c2a] text-white" : isDone ? "bg-green-500 text-white" : "bg-neutral-200 text-neutral-500"
                    )}>
                      {isDone ? "✓" : i + 1}
                    </div>
                    <span className="hidden sm:block">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && <ChevronRight className="w-3 h-3 text-neutral-300" />}
                </div>
              );
            })}
          </div>
          <Link href="/cart" className="text-sm text-neutral-400 hover:text-neutral-600">
            ← Cart
          </Link>
        </div>
      </div>

      <div className="container-site py-10">
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">

          {/* ── Left: Steps ── */}
          <div className="space-y-6">

            {/* STEP 1: Delivery Address */}
            <div className={cn("bg-white rounded-2xl border transition-all", step === "address" ? "border-[#d98c2a]/30 shadow-sm" : "border-neutral-100")}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#d98c2a]" />
                  <h2 className="font-semibold text-neutral-900">Delivery Address</h2>
                </div>
                {step !== "address" && (
                  <button onClick={() => setStep("address")} className="text-xs text-[#d98c2a] hover:underline">Edit</button>
                )}
              </div>

              {step === "address" ? (
                <div className="p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="First Name" required>
                      <Input value={address.firstName} onChange={(v) => set("firstName", v)} placeholder="Adaeze" />
                    </Field>
                    <Field label="Last Name" required>
                      <Input value={address.lastName} onChange={(v) => set("lastName", v)} placeholder="Okafor" />
                    </Field>
                  </div>
                  <Field label="Phone Number" required>
                    <Input value={address.phone} onChange={(v) => set("phone", v)} placeholder="+234 801 234 5678" type="tel" />
                  </Field>
                  <Field label="Address Line 1" required>
                    <Input value={address.addressLine1} onChange={(v) => set("addressLine1", v)} placeholder="123 Adeola Odeku Street" />
                  </Field>
                  <Field label="Address Line 2">
                    <Input value={address.addressLine2} onChange={(v) => set("addressLine2", v)} placeholder="Apt, Suite, Floor (optional)" />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="City" required>
                      <Input value={address.city} onChange={(v) => set("city", v)} placeholder="Lagos" />
                    </Field>
                    <Field label="State" required>
                      <div>
                        <select
                          value={address.state}
                          onChange={(e) => set("state", e.target.value)}
                          className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors"
                        >
                          <option value="">Select state…</option>
                          {NIGERIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </Field>
                  </div>
                  <button
                    onClick={() => { if (validateAddress()) setStep("shipping"); }}
                    className="w-full py-3.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors flex items-center justify-center gap-2"
                  >
                    Continue to Shipping <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4 text-sm text-neutral-600">
                  {address.firstName} {address.lastName} · {address.phone}
                  <br />{address.addressLine1}, {address.city}, {address.state}
                </div>
              )}
            </div>

            {/* STEP 2: Shipping */}
            {(step === "shipping" || step === "payment") && (
              <div className={cn("bg-white rounded-2xl border transition-all", step === "shipping" ? "border-[#d98c2a]/30 shadow-sm" : "border-neutral-100")}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#d98c2a]" />
                    <h2 className="font-semibold text-neutral-900">Shipping Method</h2>
                  </div>
                  {step === "payment" && (
                    <button onClick={() => setStep("shipping")} className="text-xs text-[#d98c2a] hover:underline">Edit</button>
                  )}
                </div>

                {step === "shipping" ? (
                  <div className="p-6 space-y-4">
                    {loadingShip ? (
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Calculating shipping for {address.state}…
                      </div>
                    ) : shipping ? (
                      <div className="p-4 border-2 border-[#d98c2a] rounded-xl bg-[#d98c2a]/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-neutral-900 text-sm">{shipping.label}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">Estimated {shipping.estimatedDays} business days</p>
                          </div>
                          <p className="font-semibold text-neutral-900">
                            {shipping.isFree ? (
                              <span className="text-green-600">Free</span>
                            ) : formatPrice(shipping.cost)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        Select a state above to calculate shipping cost.
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                      <strong>Note:</strong> Delivery fees are estimates. The admin may adjust the final delivery cost before dispatch, and you will be notified of any changes.
                    </div>

                    <button
                      onClick={() => setStep("payment")}
                      disabled={!shipping}
                      className="w-full py-3.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      Continue to Payment <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="px-6 py-4 text-sm text-neutral-600 flex items-center justify-between">
                    <span>{shipping?.label}</span>
                    <span className="font-medium">{shipping?.isFree ? "Free" : formatPrice(shipping?.cost ?? 0)}</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Payment */}
            {step === "payment" && (
              <div className="bg-white rounded-2xl border border-[#d98c2a]/30 shadow-sm">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-100">
                  <CreditCard className="w-4 h-4 text-[#d98c2a]" />
                  <h2 className="font-semibold text-neutral-900">Payment Method</h2>
                </div>
                <div className="p-6 space-y-3">
                  {([
                    { id: "paystack",    label: "Paystack",            sub: "Card, Bank Transfer, USSD" },
                    { id: "flutterwave", label: "Flutterwave",         sub: "Card, Bank Transfer, Mobile Money" },
                    { id: "cod",         label: "Cash on Delivery",    sub: "Pay when your order arrives" },
                  ] as { id: PaymentMethod; label: string; sub: string }[]).map((pm) => (
                    <label key={pm.id} className={cn(
                      "flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all",
                      paymentMethod === pm.id ? "border-[#d98c2a] bg-[#d98c2a]/5" : "border-neutral-200 hover:border-neutral-300"
                    )}>
                      <input type="radio" value={pm.id} checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)} className="accent-[#d98c2a]" />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{pm.label}</p>
                        <p className="text-xs text-neutral-400">{pm.sub}</p>
                      </div>
                    </label>
                  ))}

                  <button
                    onClick={placeOrder}
                    disabled={placing}
                    className="w-full py-4 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-2"
                  >
                    {placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {placing ? "Processing…" : paymentMethod === "cod" ? "Place Order" : "Proceed to Payment"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="sticky top-24">
            <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">Order Summary</h2>
            <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-5">
              {/* Items */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map((item) => {
                  const price = item.variant?.price ?? item.product.price;
                  const img   = item.product.images?.[0]?.url;
                  return (
                    <div key={`${item.product._id}-${item.variant?.value}`} className="flex gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                        {img
                          ? <Image src={img} alt={item.product.name} fill className="object-cover" sizes="48px" />
                          : <ShoppingBag className="w-5 h-5 text-neutral-300 m-auto mt-3.5" />}
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#d98c2a] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-800 truncate">{item.product.name}</p>
                        {item.variant && <p className="text-[10px] text-neutral-400">{item.variant.value}</p>}
                        <p className="text-xs font-semibold text-neutral-900 mt-0.5">{formatPrice(price * item.quantity)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon */}
              <div className="border-t border-neutral-100 pt-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Tag className="w-3.5 h-3.5" />
                      <span className="font-medium">{appliedCoupon}</span>
                      <span className="text-green-600">-{formatPrice(discount)}</span>
                    </div>
                    <button onClick={() => { setDiscount(0); setAppliedCoupon(""); setCouponCode(""); }}>
                      <X className="w-3.5 h-3.5 text-green-500 hover:text-red-400" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        placeholder="Coupon code"
                        className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-[#d98c2a]"
                      />
                    </div>
                    <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
                      className="px-3 py-2 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 flex-shrink-0">
                      {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-neutral-100 pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span>
                    {!shipping ? (
                      <span className="text-neutral-400 text-xs">Calculated at next step</span>
                    ) : shipping.isFree ? (
                      <span className="text-green-600 font-medium">Free</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base text-neutral-900 pt-2 border-t border-neutral-100">
                  <span>Total</span>
                  <span className="font-display text-xl">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
