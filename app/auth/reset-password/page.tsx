"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import axios from "axios";
import { cn } from "@/utils";

function ResetForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm)  { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { token, password });
      setDone(true);
      // Fixed: was redirecting to /sign-in which doesn't exist
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? "Invalid or expired link. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="font-display text-xl font-semibold text-neutral-900 mb-2">
          Invalid Reset Link
        </h2>
        <p className="text-sm text-neutral-500 mb-5">
          This link is missing a token. Please request a new one.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center gap-2 py-3 px-5 text-sm font-medium rounded-xl text-white"
          style={{ backgroundColor: "#d98c2a" }}
        >
          Request New Link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-green-50 border-4 border-green-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-2">
          Password Reset!
        </h2>
        <p className="text-sm text-neutral-500 mb-1">Your password has been updated successfully.</p>
        <p className="text-xs text-neutral-400">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
          style={{ backgroundColor: "rgba(217,140,42,0.1)" }}
        >
          <Lock className="w-6 h-6" style={{ color: "#d98c2a" }} />
        </div>
        <h1 className="font-display text-2xl font-semibold text-neutral-900 mb-1.5">
          Set new password
        </h1>
        <p className="text-sm text-neutral-400">
          Must be at least 8 characters.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-3.5 py-3 pr-11 text-sm border border-neutral-200 rounded-xl outline-none focus:border-[#d98c2a] focus:ring-2 focus:ring-[#d98c2a]/10 transition-all bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
            Confirm Password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            className={cn(
              "w-full px-3.5 py-3 text-sm border rounded-xl outline-none focus:ring-2 transition-all bg-white",
              confirm && confirm !== password
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-neutral-200 focus:border-[#d98c2a] focus:ring-[#d98c2a]/10"
            )}
          />
          {confirm && confirm !== password && (
            <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-all mt-2"
          style={{ backgroundColor: "#d98c2a" }}
          onMouseEnter={(e) => !loading && ((e.currentTarget as HTMLElement).style.backgroundColor = "#c47020")}
          onMouseLeave={(e) => !loading && ((e.currentTarget as HTMLElement).style.backgroundColor = "#d98c2a")}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
            : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
        <Link
          href="/auth/login"
          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f0] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-display text-2xl font-semibold text-neutral-900">
              Mercy<span style={{ color: "#d98c2a" }}>Home</span>
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-8 shadow-sm">
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#d98c2a" }} />
            </div>
          }>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
