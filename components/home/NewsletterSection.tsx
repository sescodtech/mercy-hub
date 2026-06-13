"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle } from "lucide-react";

interface Props {
  title?: string;
  subtitle?: string;
}

export function NewsletterSection({
  title   = "Join the Mercy Family",
  subtitle = "Get 10% off your first order and early access to new arrivals.",
}: Props) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    setLoading(true); setError("");
    try {
      // Replace with your actual newsletter endpoint
      await new Promise((r) => setTimeout(r, 800));
      setSuccess(true); setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="py-16 sm:py-20"
      style={{ backgroundColor: "var(--color-text-primary)" }}
    >
      <div className="container-site max-w-2xl text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-brand-primary) 20%, transparent)" }}
        >
          <Mail className="w-7 h-7" style={{ color: "var(--color-brand-primary)" }} />
        </div>

        <h2
          className="font-display text-3xl sm:text-4xl font-semibold mb-4"
          style={{ color: "#ffffff" }}
        >
          {title}
        </h2>
        <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
          {subtitle}
        </p>

        {success ? (
          <div className="flex items-center justify-center gap-3" style={{ color: "var(--color-success)" }}>
            <CheckCircle className="w-6 h-6" />
            <p className="font-medium">Welcome to the family! Check your inbox.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
              }}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 whitespace-nowrap"
              style={{ backgroundColor: "var(--color-brand-primary)" }}
              onMouseEnter={(e) => !(e.currentTarget as HTMLButtonElement).disabled && ((e.currentTarget as HTMLElement).style.filter = "brightness(0.9)")}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.filter = ""}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}

        {error && (
          <p className="text-sm mt-3" style={{ color: "var(--color-error)" }}>{error}</p>
        )}

        <p className="text-xs mt-5" style={{ color: "rgba(255,255,255,0.3)" }}>
          No spam, ever. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
