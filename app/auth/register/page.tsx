"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/utils";

const STRENGTHS = [
  { test: (p: string) => p.length >= 8,           label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p),         label: "One uppercase letter" },
  { test: (p: string) => /[0-9]/.test(p),         label: "One number" },
  { test: (p: string) => /[^a-zA-Z0-9]/.test(p), label: "One special character" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const score = STRENGTHS.filter((s) => s.test(form.password)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      return toast.error("Please fill in all fields.");
    }
    if (form.password !== form.confirm) {
      return toast.error("Passwords do not match.");
    }
    if (score < 2) {
      return toast.error("Please use a stronger password.");
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/register", { name: form.name, email: form.email, password: form.password });
      toast.success("Account created! Signing you in…");
      await signIn("credentials", { email: form.email, password: form.password, redirect: false, callbackUrl: "/dashboard" });
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-display text-3xl font-semibold text-ebony">
              Mercy<span className="text-brand-500">Home</span>
            </span>
          </Link>
          <h1 className="font-display text-2xl font-semibold text-neutral-900 mt-6 mb-1">Create your account</h1>
          <p className="text-sm text-neutral-400">Join thousands of happy customers</p>
        </div>

        <div className="bg-white rounded-2xl shadow-luxury p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Full Name</label>
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input-field"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Email</label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="input-field pr-10"
                  placeholder="Create a strong password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength indicators */}
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= score ? ["bg-red-400","bg-orange-400","bg-yellow-400","bg-green-500"][score - 1] : "bg-neutral-100")} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {STRENGTHS.map((s) => (
                      <div key={s.label} className={cn("flex items-center gap-1 text-xs", s.test(form.password) ? "text-green-600" : "text-neutral-400")}>
                        <CheckCircle className={cn("w-3 h-3", s.test(form.password) ? "text-green-500" : "text-neutral-200")} />
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                className={cn("input-field", form.confirm && form.confirm !== form.password && "border-red-300 focus:border-red-400 focus:ring-red-100")}
                placeholder="Repeat your password"
              />
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-xs text-neutral-400 text-center mt-4">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-brand-600 hover:underline">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        <p className="text-center text-sm text-neutral-400 mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
