"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import axios from "axios";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email"); return; }
    setLoading(true); setError("");
    try {
      await axios.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-neutral-900 mb-2">Check your email</h1>
              <p className="text-sm text-neutral-500 mb-6">
                If <span className="font-medium text-neutral-700">{email}</span> is registered,
                you'll receive a reset link shortly.
              </p>
              <p className="text-xs text-neutral-400 mb-6">
                Didn't get it? Check your spam folder or{" "}
                <button onClick={() => setSent(false)} className="text-[#d98c2a] hover:underline">try again</button>.
              </p>
              <Link href="/sign-in" className="text-sm text-[#d98c2a] hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <div className="w-12 h-12 bg-[#d98c2a]/10 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#d98c2a]" />
                </div>
                <h1 className="font-display text-2xl font-semibold text-neutral-900 mb-1">Forgot password?</h1>
                <p className="text-sm text-neutral-500">Enter your email and we'll send you a reset link.</p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-3 outline-none focus:border-[#d98c2a] transition-colors"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/sign-in" className="text-sm text-neutral-400 hover:text-neutral-600 flex items-center justify-center gap-1 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
