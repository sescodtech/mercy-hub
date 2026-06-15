"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle, ShoppingBag } from "lucide-react";
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

const STRENGTH_COLORS = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
const STRENGTH_LABELS = ["Weak", "Fair", "Good", "Strong"];

export default function RegisterPage() {
  const router  = useRouter();
  const [form,    setForm]    = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const score = STRENGTHS.filter((s) => s.test(form.password)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (score < 2) {
      toast.error("Please use a stronger password.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/register", {
        name:     form.name,
        email:    form.email,
        password: form.password,
      });
      toast.success("Account created! Signing you in…");
      await signIn("credentials", {
        email:       form.email,
        password:    form.password,
        callbackUrl: "/dashboard",
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error ?? "Failed to create account.");
      setLoading(false);
    }
  };

  const handleGoogle = () => signIn("google", { callbackUrl: "/dashboard" });

  return (
    <div className="min-h-screen bg-[#fdf8f0] flex">

      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundColor: "#1a1208" }}
      >
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(circle at 25px 25px, #d98c2a 2px, transparent 0)",
            backgroundSize: "50px 50px",
          }}
        />

        <Link href="/" className="relative z-10">
          <span className="font-display text-2xl font-semibold text-white">
            Mercy<span style={{ color: "#d98c2a" }}>Home</span>
          </span>
        </Link>

        <div className="relative z-10 space-y-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(217,140,42,0.15)" }}
          >
            <ShoppingBag className="w-7 h-7" style={{ color: "#d98c2a" }} />
          </div>
          <div>
            <h2 className="font-display text-3xl font-semibold text-white leading-tight mb-3">
              Join Thousands of Happy Customers
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Create your account and start enjoying premium home essentials delivered right to your door.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              "Track all your orders in one place",
              "Save items to your wishlist",
              "Faster checkout every time",
              "Exclusive member deals and offers",
            ].map((point) => (
              <div key={point} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white"
                  style={{ backgroundColor: "#d98c2a" }}
                >
                  ✓
                </div>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {point}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} Mercy Home Essentials
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-12">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <span className="font-display text-2xl font-semibold text-neutral-900">
                Mercy<span style={{ color: "#d98c2a" }}>Home</span>
              </span>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-neutral-900 mb-1.5">
              Create your account
            </h1>
            <p className="text-sm text-neutral-400">
              Join thousands of happy customers
            </p>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-neutral-200 rounded-xl py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all mb-6"
          >
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-100" />
            </div>
            <div className="relative text-center">
              <span className="bg-[#fdf8f0] px-4 text-xs text-neutral-400">or sign up with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                className="w-full px-3.5 py-3 text-sm border border-neutral-200 rounded-xl outline-none focus:border-[#d98c2a] focus:ring-2 focus:ring-[#d98c2a]/10 transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full px-3.5 py-3 text-sm border border-neutral-200 rounded-xl outline-none focus:border-[#d98c2a] focus:ring-2 focus:ring-[#d98c2a]/10 transition-all bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Create a strong password"
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

              {/* Strength meter */}
              {form.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-all duration-300",
                            i <= score ? STRENGTH_COLORS[score - 1] : "bg-neutral-100"
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn("text-[10px] font-semibold", score >= 3 ? "text-green-600" : score >= 2 ? "text-yellow-600" : "text-red-500")}>
                      {STRENGTH_LABELS[score - 1] ?? "Too weak"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {STRENGTHS.map((s) => (
                      <div key={s.label} className={cn("flex items-center gap-1 text-[10px]", s.test(form.password) ? "text-green-600" : "text-neutral-400")}>
                        <CheckCircle className={cn("w-3 h-3 flex-shrink-0", s.test(form.password) ? "text-green-500" : "text-neutral-200")} />
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat your password"
                className={cn(
                  "w-full px-3.5 py-3 text-sm border rounded-xl outline-none focus:ring-2 transition-all bg-white",
                  form.confirm && form.confirm !== form.password
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-neutral-200 focus:border-[#d98c2a] focus:ring-[#d98c2a]/10"
                )}
              />
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-500 mt-1">Passwords don&apos;t match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-all mt-2"
              style={{ backgroundColor: "#d98c2a" }}
              onMouseEnter={(e) => !loading && ((e.currentTarget as HTMLElement).style.backgroundColor = "#c47020")}
              onMouseLeave={(e) => !loading && ((e.currentTarget as HTMLElement).style.backgroundColor = "#d98c2a")}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-xs text-neutral-400 text-center mt-4">
            By creating an account, you agree to our{" "}
            <Link href="/terms" style={{ color: "#d98c2a" }} className="hover:underline">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" style={{ color: "#d98c2a" }} className="hover:underline">Privacy Policy</Link>.
          </p>

          <p className="text-center text-sm text-neutral-400 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "#d98c2a" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
