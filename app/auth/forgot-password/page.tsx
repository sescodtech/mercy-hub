"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email address."); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf8f0] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/">
            <span className="font-display text-2xl font-semibold text-neutral-900">
              Mercy<span style={{ color: "#d98c2a" }}>Home</span>
            </span>
          </Link>
        </div>

        {sent ? (
          /* Success state */
          <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-neutral-900 mb-2">
              Check your email
            </h1>
            <p className="text-sm text-neutral-500 mb-2">
              We&apos;ve sent a password reset link to
            </p>
            <p className="text-sm font-semibold text-neutral-800 mb-6">{email}</p>
            <p className="text-xs text-neutral-400 mb-6">
              Didn&apos;t receive the email? Check your spam folder or{" "}
              <button
                onClick={() => setSent(false)}
                className="font-medium hover:underline"
                style={{ color: "#d98c2a" }}
              >
                try again
              </button>
            </p>
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 py-3 text-sm font-medium border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-neutral-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        ) : (
          /* Form state */
          <div className="bg-white rounded-2xl border border-neutral-100 p-8 shadow-sm">
            {/* Icon */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ backgroundColor: "rgba(217,140,42,0.1)" }}>
              <Mail className="w-6 h-6" style={{ color: "#d98c2a" }} />
            </div>

            <h1 className="font-display text-2xl font-semibold text-neutral-900 mb-2">
              Forgot password?
            </h1>
            <p className="text-sm text-neutral-400 mb-7">
              No worries — enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-3 text-sm border border-neutral-200 rounded-xl outline-none focus:border-[#d98c2a] focus:ring-2 focus:ring-[#d98c2a]/10 transition-all bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-all"
                style={{ backgroundColor: "#d98c2a" }}
                onMouseEnter={(e) => !loading && ((e.currentTarget as HTMLElement).style.backgroundColor = "#c47020")}
                onMouseLeave={(e) => !loading && ((e.currentTarget as HTMLElement).style.backgroundColor = "#d98c2a")}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
