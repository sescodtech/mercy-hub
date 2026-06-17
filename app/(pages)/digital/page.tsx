"use client";

/**
 * app/(pages)/digital/page.tsx
 * Customer-facing Digital Services hub
 * Services: Data, Airtime, Cable TV, Education
 * Payment: Wallet or Paystack
 */

import { useState, useEffect, useCallback } from "react";
import {
  Wifi, Phone, Tv, BookOpen, Wallet, ChevronRight,
  CheckCircle, XCircle, Loader2, RefreshCw, Plus,
  ArrowLeft, ShieldCheck,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────
type Category  = "data" | "airtime" | "cable" | "education";
type Network   = "mtn" | "airtel" | "glo" | "9mobile";
type PayMethod = "wallet" | "paystack";

interface Plan {
  id: string;
  name: string;
  validity?: string;
  network?: string;
  planType?: string;
  providerPlanId?: string;
  price: number;
  // cable
  planId?: number;
  provider?: string;
  // education
  examName?: string;
  quantity?: number;
  // airtime
}

// ─── Constants ────────────────────────────────────────────────
const CATEGORIES: { id: Category; label: string; icon: typeof Wifi; color: string; desc: string }[] = [
  { id: "data",      label: "Data Bundles",  icon: Wifi,      color: "#d98c2a", desc: "Buy data for any network" },
  { id: "airtime",   label: "Airtime",       icon: Phone,     color: "#10b981", desc: "Recharge any number" },
  { id: "cable",     label: "Cable TV",      icon: Tv,        color: "#6366f1", desc: "DStv, GOtv, Startimes" },
  { id: "education", label: "Education",     icon: BookOpen,  color: "#f59e0b", desc: "WAEC, NECO, NABTEB pins" },
];

const NETWORKS: { id: Network; label: string; color: string }[] = [
  { id: "mtn",     label: "MTN",     color: "#FFD700" },
  { id: "airtel",  label: "Airtel",  color: "#ef4444" },
  { id: "glo",     label: "Glo",     color: "#22c55e" },
  { id: "9mobile", label: "9mobile", color: "#10b981" },
];

const CABLE_PROVIDERS = ["dstv", "gotv", "startimes"];

function fmt(n: number) { return `₦${n.toLocaleString("en-NG")}`; }

// ─── Main Page ────────────────────────────────────────────────
export default function DigitalPage() {
  const [step,     setStep]     = useState<"category" | "form" | "confirm" | "result">("category");
  const [category, setCategory] = useState<Category | null>(null);
  const [network,  setNetwork]  = useState<Network | "">("");
  const [plans,    setPlans]    = useState<Plan[]>([]);
  const [plan,     setPlan]     = useState<Plan | null>(null);
  const [phone,    setPhone]    = useState("");
  const [smartcard,setSmartcard]= useState("");
  const [cableProv,setCableProv]= useState("dstv");
  const [payMethod,setPayMethod]= useState<PayMethod>("wallet");
  const [walletBal,setWalletBal]= useState(0);
  const [loading,  setLoading]  = useState(false);
  const [planLoad, setPlanLoad] = useState(false);
  const [result,   setResult]   = useState<{ success: boolean; message?: string; error?: string; orderRef?: string; pins?: string[] } | null>(null);

  // Fetch wallet balance
  useEffect(() => {
    fetch("/api/digital/wallet/balance")
      .then(r => r.json())
      .then(d => { if (d.success) setWalletBal(d.balance); })
      .catch(() => {});
  }, []);

  // Fetch plans when category/network changes
  const fetchPlans = useCallback(async (cat: Category, net?: string) => {
    setPlanLoad(true);
    setPlan(null);
    try {
      const q = net ? `&network=${net}` : "";
      const r = await fetch(`/api/digital/plans?category=${cat}${q}`);
      const d = await r.json();
      if (d.success) setPlans(d.data);
    } catch {}
    setPlanLoad(false);
  }, []);

  function selectCategory(cat: Category) {
    setCategory(cat);
    setNetwork("");
    setPlans([]);
    setPlan(null);
    setStep("form");
    if (cat !== "data") fetchPlans(cat);
  }

  function handleNetworkChange(net: Network) {
    setNetwork(net);
    if (category === "data") fetchPlans("data", net);
  }

  // ── Purchase ──────────────────────────────────────────────
  async function handlePurchase() {
    if (!plan || !category) return;
    setLoading(true);

    let body: Record<string, unknown> = {
      category,
      paymentMethod: payMethod,
    };

    if (category === "data") {
      body = { ...body, network, phone, providerPlanId: plan.providerPlanId || plan.id, planName: plan.name };
    } else if (category === "airtime") {
      body = { ...body, network, phone, amount: plan.price };
    } else if (category === "cable") {
      body = { ...body, cableProvider: cableProv, smartcard, planId: plan.planId };
    } else if (category === "education") {
      body = { ...body, examName: plan.examName, quantity: plan.quantity || 1 };
    }

    if (payMethod === "paystack") {
      // Redirect to Paystack
      const initRes = await fetch("/api/digital/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: plan.price }),
      });
      const initData = await initRes.json();
      if (initData.authorizationUrl) {
        window.location.href = initData.authorizationUrl;
        return;
      }
    }

    try {
      const r = await fetch("/api/digital/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      setResult(d);
      setStep("result");
      if (d.success) {
        // Refresh balance
        fetch("/api/digital/wallet/balance").then(r => r.json()).then(d => { if (d.success) setWalletBal(d.balance); });
      }
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
      setStep("result");
    }
    setLoading(false);
  }

  function reset() {
    setStep("category");
    setCategory(null);
    setNetwork("");
    setPlans([]);
    setPlan(null);
    setPhone("");
    setSmartcard("");
    setResult(null);
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fdf8f0]">

      {/* Header */}
      <div className="bg-white border-b border-neutral-100 sticky top-0 z-10">
        <div className="container-site py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== "category" && (
              <button onClick={() => setStep(step === "result" ? "category" : "form")}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="font-semibold text-neutral-900 text-lg leading-none">Digital Services</h1>
              <p className="text-xs text-neutral-400 mt-0.5">Data · Airtime · Cable TV · Education</p>
            </div>
          </div>

          {/* Wallet Balance */}
          <Link href="/digital/wallet"
            className="flex items-center gap-2 bg-[#d98c2a]/10 border border-[#d98c2a]/20 rounded-xl px-3 py-2 hover:bg-[#d98c2a]/15 transition-colors">
            <Wallet className="w-4 h-4 text-[#d98c2a]" />
            <span className="text-sm font-semibold text-[#d98c2a]">{fmt(walletBal)}</span>
          </Link>
        </div>
      </div>

      <div className="container-site py-8 max-w-2xl mx-auto">

        {/* ── Step 1: Category Select ──────────────────────────── */}
        {step === "category" && (
          <div>
            <p className="text-neutral-500 text-sm mb-6 text-center">What would you like to do today?</p>
            <div className="grid grid-cols-2 gap-4">
              {CATEGORIES.map(({ id, label, icon: Icon, color, desc }) => (
                <button key={id}
                  onClick={() => selectCategory(id)}
                  className="bg-white rounded-2xl p-5 text-left border border-neutral-100 hover:border-[#d98c2a]/30 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: color + "18" }}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <p className="font-semibold text-neutral-900 text-sm group-hover:text-[#d98c2a] transition-colors">{label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>

            {/* Recent transactions shortcut */}
            <div className="mt-6 bg-white rounded-2xl border border-neutral-100 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-700">Recent Orders</p>
                <Link href="/dashboard/digital-orders" className="text-xs text-[#d98c2a] hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Form ─────────────────────────────────────── */}
        {step === "form" && category && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">

              {/* ── DATA ── */}
              {category === "data" && (
                <>
                  <h2 className="font-semibold text-neutral-900 mb-4">Select Network</h2>
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {NETWORKS.map(n => (
                      <button key={n.id}
                        onClick={() => handleNetworkChange(n.id as Network)}
                        className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                          network === n.id
                            ? "border-[#d98c2a] bg-[#d98c2a]/10 text-[#d98c2a]"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}>
                        {n.label}
                      </button>
                    ))}
                  </div>

                  {network && (
                    <>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone Number</label>
                      <input
                        type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="08012345678" maxLength={11}
                        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d98c2a] focus:ring-1 focus:ring-[#d98c2a]/30 mb-5"
                      />

                      <h3 className="font-medium text-neutral-700 mb-3 text-sm">Select Bundle</h3>
                      {planLoad ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-[#d98c2a]" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                          {plans.map(p => (
                            <button key={p.id}
                              onClick={() => setPlan(p)}
                              className={`p-3 rounded-xl text-left border-2 transition-all ${
                                plan?.id === p.id
                                  ? "border-[#d98c2a] bg-[#d98c2a]/8"
                                  : "border-neutral-200 hover:border-neutral-300"
                              }`}>
                              <p className="font-semibold text-sm text-neutral-900">{p.name.replace(/^(MTN|AIRTEL|GLO|9mobile)\s*/i, "")}</p>
                              {p.validity && <p className="text-xs text-neutral-400">{p.validity}</p>}
                              <p className="text-sm font-bold text-[#d98c2a] mt-1">{fmt(p.price)}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ── AIRTIME ── */}
              {category === "airtime" && (
                <>
                  <h2 className="font-semibold text-neutral-900 mb-4">Buy Airtime</h2>
                  <div className="grid grid-cols-4 gap-2 mb-5">
                    {NETWORKS.map(n => (
                      <button key={n.id}
                        onClick={() => setNetwork(n.id as Network)}
                        className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                          network === n.id
                            ? "border-[#d98c2a] bg-[#d98c2a]/10 text-[#d98c2a]"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}>
                        {n.label}
                      </button>
                    ))}
                  </div>

                  {network && (
                    <>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Phone Number</label>
                      <input
                        type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="08012345678" maxLength={11}
                        className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d98c2a] focus:ring-1 focus:ring-[#d98c2a]/30 mb-5"
                      />

                      <h3 className="font-medium text-neutral-700 mb-3 text-sm">Select Amount</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {plans.map(p => (
                          <button key={p.id}
                            onClick={() => setPlan(p)}
                            className={`py-3 rounded-xl text-center border-2 transition-all ${
                              plan?.id === p.id
                                ? "border-[#d98c2a] bg-[#d98c2a]/10"
                                : "border-neutral-200 hover:border-neutral-300"
                            }`}>
                            <p className="font-bold text-sm text-[#d98c2a]">{fmt(p.price)}</p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── CABLE ── */}
              {category === "cable" && (
                <>
                  <h2 className="font-semibold text-neutral-900 mb-4">Cable TV Subscription</h2>

                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Provider</label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {CABLE_PROVIDERS.map(p => (
                      <button key={p}
                        onClick={() => { setCableProv(p); setPlan(null); }}
                        className={`py-3 rounded-xl text-sm font-semibold border-2 capitalize transition-all ${
                          cableProv === p
                            ? "border-[#d98c2a] bg-[#d98c2a]/10 text-[#d98c2a]"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}>
                        {p === "startimes" ? "StarTimes" : p.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Smartcard / IUC Number</label>
                  <input
                    type="text" value={smartcard} onChange={e => setSmartcard(e.target.value)}
                    placeholder="Enter smartcard number"
                    className="w-full border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d98c2a] focus:ring-1 focus:ring-[#d98c2a]/30 mb-4"
                  />

                  <h3 className="font-medium text-neutral-700 mb-3 text-sm">Select Plan</h3>
                  {planLoad ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#d98c2a]" /></div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {plans.filter(p => p.provider === cableProv).map(p => (
                        <button key={p.id}
                          onClick={() => setPlan(p)}
                          className={`w-full p-3 rounded-xl text-left border-2 flex justify-between items-center transition-all ${
                            plan?.id === p.id
                              ? "border-[#d98c2a] bg-[#d98c2a]/8"
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}>
                          <span className="text-sm font-medium text-neutral-800">{p.name}</span>
                          <span className="text-sm font-bold text-[#d98c2a]">{fmt(p.price)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── EDUCATION ── */}
              {category === "education" && (
                <>
                  <h2 className="font-semibold text-neutral-900 mb-4">Exam Result Checker</h2>
                  <p className="text-sm text-neutral-500 mb-4">Purchase scratch card PIN to check your exam results online.</p>

                  {planLoad ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#d98c2a]" /></div>
                  ) : (
                    <div className="space-y-3">
                      {plans.map(p => (
                        <button key={p.id}
                          onClick={() => setPlan(p)}
                          className={`w-full p-4 rounded-xl text-left border-2 flex justify-between items-center transition-all ${
                            plan?.id === p.id
                              ? "border-[#d98c2a] bg-[#d98c2a]/8"
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}>
                          <div>
                            <p className="font-semibold text-neutral-900 text-sm">{p.name}</p>
                            <p className="text-xs text-neutral-400">1 scratch card</p>
                          </div>
                          <span className="text-sm font-bold text-[#d98c2a]">{fmt(p.price)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Payment method */}
            {plan && (
              <div className="bg-white rounded-2xl border border-neutral-100 p-5">
                <h3 className="font-medium text-neutral-700 mb-3 text-sm">Payment Method</h3>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    onClick={() => setPayMethod("wallet")}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      payMethod === "wallet"
                        ? "border-[#d98c2a] bg-[#d98c2a]/8"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}>
                    <Wallet className="w-4 h-4 text-[#d98c2a] mb-1" />
                    <p className="text-sm font-semibold text-neutral-800">Wallet</p>
                    <p className="text-xs text-neutral-400">Balance: {fmt(walletBal)}</p>
                  </button>
                  <button
                    onClick={() => setPayMethod("paystack")}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      payMethod === "paystack"
                        ? "border-[#d98c2a] bg-[#d98c2a]/8"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}>
                    <ShieldCheck className="w-4 h-4 text-green-500 mb-1" />
                    <p className="text-sm font-semibold text-neutral-800">Paystack</p>
                    <p className="text-xs text-neutral-400">Card / Transfer</p>
                  </button>
                </div>

                {payMethod === "wallet" && walletBal < plan.price && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-700">
                    <span>Insufficient balance.</span>
                    <Link href="/digital/wallet" className="underline font-medium">Top up wallet</Link>
                  </div>
                )}

                <div className="border-t border-neutral-100 pt-4 mb-4">
                  <div className="flex justify-between text-sm text-neutral-600 mb-1">
                    <span>Plan</span>
                    <span className="font-medium text-neutral-900">{plan.name}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold mt-2">
                    <span>Total</span>
                    <span className="text-[#d98c2a]">{fmt(plan.price)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={
                    loading ||
                    !plan ||
                    (payMethod === "wallet" && walletBal < plan.price) ||
                    ((category === "data" || category === "airtime") && (!phone || phone.length < 10)) ||
                    (category === "cable" && !smartcard)
                  }
                  className="w-full bg-[#c47020] text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-[#a3551c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : `Pay ${fmt(plan.price)}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Result ───────────────────────────────────── */}
        {step === "result" && result && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
            {result.success ? (
              <>
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="font-semibold text-neutral-900 text-xl mb-2">Order Successful!</h2>
                <p className="text-neutral-500 text-sm mb-1">{result.message}</p>
                {result.orderRef && (
                  <p className="text-xs text-neutral-400 mb-4">Ref: {result.orderRef}</p>
                )}
                {result.pins && result.pins.length > 0 && (
                  <div className="bg-[#fdf8f0] border border-[#d98c2a]/20 rounded-xl p-4 mb-5 text-left">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Your Exam Pins</p>
                    {result.pins.map((pin, i) => (
                      <p key={i} className="font-mono text-lg font-bold text-[#d98c2a] text-center">{pin}</p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="font-semibold text-neutral-900 text-xl mb-2">Order Failed</h2>
                <p className="text-neutral-500 text-sm mb-4">{result.error}</p>
                {result.orderRef && (
                  <p className="text-xs text-neutral-400 mb-4">Ref: {result.orderRef}</p>
                )}
              </>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={reset}
                className="flex items-center gap-2 bg-[#c47020] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#a3551c] transition-colors">
                <RefreshCw className="w-4 h-4" /> New Purchase
              </button>
              <Link href="/dashboard/digital-orders"
                className="flex items-center gap-2 border border-neutral-200 text-neutral-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors">
                View Orders
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
