"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import axios from "axios";

function ResetForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => router.push("/sign-in"), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? "Invalid or expired link. Request a new one.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-neutral-600 text-sm mb-4">Invalid reset link. Please request a new one.</p>
        <Link href="/forgot-password" className="text-sm text-[#d98c2a] hover:underline">Request reset link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="font-display text-xl font-semibold text-neutral-900 mb-2">Password reset!</h2>
        <p className="text-sm text-neutral-500">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7">
        <div className="w-12 h-12 bg-[#d98c2a]/10 rounded-xl flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-[#d98c2a]" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-neutral-900 mb-1">Set new password</h1>
        <p className="text-sm text-neutral-500">Must be at least 8 characters.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-3 pr-10 outline-none focus:border-[#d98c2a] transition-colors"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-3 outline-none focus:border-[#d98c2a] transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {loading ? "Resetting…" : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
          <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#d98c2a]" /></div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
