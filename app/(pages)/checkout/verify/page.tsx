"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ShoppingBag, ArrowRight, Home } from "lucide-react";
import axios from "axios";
import { useCartStore } from "@/hooks/useCart";
import { formatPrice } from "@/utils";

interface VerifyResult {
  success: boolean;
  orderNumber?: string;
  total?: number;
  error?: string;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const clearCart    = useCartStore((s) => s.clearCart);

  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";

  const [status,  setStatus]  = useState<"loading" | "success" | "failed">("loading");
  const [result,  setResult]  = useState<VerifyResult | null>(null);

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setResult({ success: false, error: "No payment reference found." });
      return;
    }

    const verify = async () => {
      try {
        // Verify payment with Paystack
        const { data } = await axios.get(
          `/api/payments/paystack/verify?reference=${encodeURIComponent(reference)}`
        );

        if (data.success) {
          clearCart();
          setResult({
            success:     true,
            orderNumber: data.data.orderNumber,
            total:       data.data.total,
          });
          setStatus("success");
        } else {
          setResult({ success: false, error: data.error || "Payment verification failed." });
          setStatus("failed");
        }
      } catch (err: any) {
        setResult({
          success: false,
          error: err.response?.data?.error || "Unable to verify payment. Please contact support.",
        });
        setStatus("failed");
      }
    };

    verify();
  }, [reference, clearCart]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#fdf8f0] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-[#d98c2a]/10 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-[#d98c2a] animate-spin" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-neutral-900 mb-2">
            Verifying Payment
          </h1>
          <p className="text-neutral-500 text-sm">
            Please wait while we confirm your payment with Paystack…
          </p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#d98c2a] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-[#fdf8f0] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          {/* Success icon */}
          <div className="w-24 h-24 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h1 className="font-display text-3xl font-semibold text-neutral-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-neutral-500 text-sm mb-8">
            Your order has been confirmed and is being prepared for delivery.
          </p>

          {/* Order card */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 mb-8 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Order Number</span>
              <span className="font-mono text-sm font-bold text-neutral-900">
                {result?.orderNumber}
              </span>
            </div>
            {result?.total && (
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <span className="text-sm text-neutral-400">Amount Paid</span>
                <span className="text-lg font-bold text-neutral-900">
                  {formatPrice(result.total)}
                </span>
              </div>
            )}
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
              <p className="text-xs text-green-700 font-medium">
                ✅ A confirmation will be sent to your WhatsApp and email shortly.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/orders"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#d98c2a] text-white text-sm font-semibold rounded-xl hover:bg-[#c47020] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Track My Order
            </Link>
            <Link
              href="/shop"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-neutral-200 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors text-neutral-700"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 mt-5 text-xs text-neutral-400 hover:text-neutral-600"
          >
            <Home className="w-3 h-3" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div className="min-h-screen bg-[#fdf8f0] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Failed icon */}
        <div className="w-24 h-24 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>

        <h1 className="font-display text-3xl font-semibold text-neutral-900 mb-2">
          Payment Failed
        </h1>
        <p className="text-neutral-500 text-sm mb-6">
          {result?.error || "We could not verify your payment. Your card has not been charged."}
        </p>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 text-left">
          <p className="text-sm text-amber-800 font-medium mb-1">What happened?</p>
          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
            <li>Your payment may have been declined by your bank</li>
            <li>The session may have expired</li>
            <li>There was a network interruption</li>
          </ul>
          <p className="text-xs text-amber-700 mt-2">
            Reference: <span className="font-mono">{reference || "N/A"}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/checkout"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#d98c2a] text-white text-sm font-semibold rounded-xl hover:bg-[#c47020] transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/contact"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-neutral-200 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors text-neutral-700"
          >
            Contact Support
          </Link>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mt-5 text-xs text-neutral-400 hover:text-neutral-600"
        >
          <Home className="w-3 h-3" /> Back to Home
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fdf8f0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#d98c2a] animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
