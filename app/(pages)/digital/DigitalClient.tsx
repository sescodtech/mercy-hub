"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Wallet, Sparkles, Gift } from "lucide-react";
import Link from "next/link";

import type { Category, Network, PayMethod, Plan, Promo, PurchaseResult, Tab } from "./types";
import { fmt } from "./types";
import { CategoryTabs } from "./components/CategoryTabs";
import { OverviewTab } from "./components/OverviewTab";
import { DataTab, AirtimeTab, CableTab, EducationTab } from "./components/ServiceForms";
import { PromoGrid } from "./components/PromoGrid";
import { OtherTab } from "./components/OtherTab";
import { OrderSummaryPanel } from "./components/OrderSummaryPanel";
import { ResultModal } from "./components/ResultModal";
import { cn } from "@/utils";

const CATEGORY_TABS: Category[] = ["data", "airtime", "cable", "education"];

export default function DigitalClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab,  setActiveTab]  = useState<Tab>("overview");
  const [network,    setNetwork]    = useState<Network | "">("");
  const [plans,      setPlans]      = useState<Plan[]>([]);
  const [plan,       setPlan]       = useState<Plan | null>(null);
  const [phone,      setPhone]      = useState("");
  const [smartcard,  setSmartcard]  = useState("");
  const [cableProv,  setCableProv]  = useState("dstv");
  const [payMethod,  setPayMethod]  = useState<PayMethod>("wallet");
  const [walletBal,  setWalletBal]  = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [planLoad,   setPlanLoad]   = useState(false);
  const [planError,  setPlanError]  = useState("");
  const [result,     setResult]     = useState<PurchaseResult | null>(null);
  const [pendingPromoId, setPendingPromoId] = useState<string | null>(null);
  // Set only when the user tapped a promo that has NO providerPlanId linked
  // (an intentionally "general" promo banner — admins are allowed to leave
  // this blank). There's nothing to auto-match, so instead of silently
  // stranding the user on the full plan grid, we show one clear instruction
  // banner naming the deal and telling them which plan to tap.
  const [unlinkedPromo, setUnlinkedPromo] = useState<Promo | null>(null);
  // Controls the mobile bottom sheet — opens the instant a plan is tapped
  // (see onPlanSelect below) so the user lands on confirm + pay immediately
  // instead of being routed back to a general plan-selection page.
  // sheetMounted = should the sheet exist at all; sheetOpen = its open/closed
  // CSS transform. Splitting them lets the sheet mount closed first, then
  // animate open on the next frame, instead of snapping open instantly.
  const [sheetOpen,    setSheetOpen]    = useState(false);
  const [sheetMounted, setSheetMounted] = useState(false);

  useEffect(() => {
    if (sheetMounted) {
      const raf = requestAnimationFrame(() => setSheetOpen(true));
      return () => cancelAnimationFrame(raf);
    }
    setSheetOpen(false);
  }, [sheetMounted]);

  // The "purchase category" is just whichever of the 4 real service tabs is active.
  // Overview / Deals / Promos / Other aren't purchase categories themselves —
  // selecting a deal routes the user into the matching category tab first.
  const category: Category | null = CATEGORY_TABS.includes(activeTab as Category) ? (activeTab as Category) : null;

  // Fetch wallet balance on mount
  useEffect(() => {
    fetch("/api/digital/wallet/balance")
      .then((r) => r.json())
      .then((d) => { if (d.success) setWalletBal(d.balance); })
      .catch(() => {});
  }, []);

  const fetchPlans = useCallback(async (cat: Category, net?: string) => {
    setPlanLoad(true);
    setPlanError("");
    setPlan(null);
    setPlans([]);
    try {
      const q = net ? `&network=${net}` : "";
      const r = await fetch(`/api/digital/plans?category=${cat}${q}`);
      const d = await r.json();
      if (d.success) {
        setPlans(d.data || []);
        if ((d.data || []).length === 0) setPlanError("No plans available at the moment. Please try again.");
      } else {
        setPlanError(d.error || "Failed to load plans.");
      }
    } catch {
      setPlanError("Network error. Please check your connection.");
    }
    setPlanLoad(false);
  }, []);

  // Auto-select the matching plan once it loads, when the user arrived via a Hot Deal / Promo.
  // Also back-fills the network selector from the matched plan — this matters when the promo
  // itself didn't have a network set (e.g. admin picked the plan but the network field was
  // left blank), so the UI still lands on the correct network tab once the plan resolves.
  useEffect(() => {
    if (!pendingPromoId || plans.length === 0) return;
    const match = plans.find(
      (p) => p.providerPlanId === pendingPromoId || p.id === pendingPromoId || String(p.planId) === pendingPromoId
    );
    if (match) {
      setPlan(match);
      if (!network && match.network) setNetwork(match.network as Network);
      setPendingPromoId(null);
    }
  }, [plans, pendingPromoId, network]);

  function handleTabClick(tab: Tab) {
    setActiveTab(tab);
    setPlan(null);
    setNetwork("");
    setPlans([]);
    setPlanError("");
    setPendingPromoId(null);
    setUnlinkedPromo(null);
    setSheetMounted(false);
    if (tab === "airtime")   fetchPlans("airtime");
    if (tab === "cable")     fetchPlans("cable");
    if (tab === "education") fetchPlans("education");
  }

  function selectPromo(promo: Promo) {
    setPlan(null);
    // Admins can intentionally leave providerPlanId blank ("general promo
    // banner with no specific plan attached") — that's a valid promo, not a
    // bug. But the old code treated a blank id as "nothing to wait for" and
    // set pendingPromoId to null, which meant the auto-select effect below
    // never even ran its guard — plan stayed null forever and the user was
    // left stranded on the full plan grid with no visible next step.
    // Now: track the promo's *category/network* even with no plan id, and
    // surface a clear single-tap action to land on this exact plan once the
    // network's plans are loaded — never a silent dead end.
    setPendingPromoId(promo.providerPlanId || null);
    setUnlinkedPromo(promo.providerPlanId ? null : promo);

    if (promo.category === "cable") {
      setCableProv(promo.network || "dstv");
      setActiveTab("cable");
      fetchPlans("cable");
    } else if (promo.category === "education") {
      setActiveTab("education");
      fetchPlans("education");
    } else if (promo.category === "airtime") {
      setNetwork((promo.network as Network) || "");
      setActiveTab("airtime");
      fetchPlans("airtime");
    } else if (promo.category === "data") {
      const promoNet = (promo.network as Network) || "";
      setNetwork(promoNet || network);
      setActiveTab("data");
      // Skip the refetch when we're already sitting on this exact network's
      // plans (e.g. tapping a Hot Deal inside the Data tab's own promo strip)
      // — the pendingPromoId effect will match against the list we already have.
      const alreadyLoaded = promoNet && promoNet === network && plans.length > 0;
      if (!alreadyLoaded) {
        // FIX: previously this only fetched plans when promo.network was set, which meant a
        // data promo/hot deal with no network field (or one resolved purely via providerPlanId)
        // never loaded any plans — so clicking it silently did nothing on the checkout step.
        // Now we always fetch: scoped to the network if we have one, otherwise all data plans,
        // and the pendingPromoId effect above will find + select the right one once they load.
        fetchPlans("data", promoNet || undefined);
      }
    } else {
      setActiveTab("other");
    }
  }

  // Deep-link support: /digital?category=data lands straight on that service's tab
  useEffect(() => {
    const requested = searchParams.get("category") as Category | null;
    if (requested && CATEGORY_TABS.includes(requested)) {
      handleTabClick(requested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleDataNetworkChange(net: Network) {
    setNetwork(net);
    fetchPlans("data", net);
  }

  function handleAirtimeNetworkChange(net: Network) {
    setNetwork(net);
    fetchPlans("airtime");
  }

  async function handlePurchase() {
    if (!plan || !category) return;
    setLoading(true);

    let body: Record<string, unknown> = { category, paymentMethod: payMethod };

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
      if (d.success) {
        fetch("/api/digital/wallet/balance").then((r) => r.json()).then((d) => {
          if (d.success) setWalletBal(d.balance);
        });
      }
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
    }
    setLoading(false);
  }

  function closeResult() {
    setResult(null);
    setPlan(null);
    setPhone("");
    setSmartcard("");
    setSheetMounted(false);
  }

  // Wraps the raw setPlan setter passed to every tab: the instant the user
  // actually picks a plan (acting on the unlinked-promo instruction banner
  // or just browsing normally), the banner is no longer relevant and should
  // disappear rather than linger above an already-selected plan.
  function handleSetPlan(p: Plan | null) {
    setPlan(p);
    if (p) setUnlinkedPromo(null);
  }

  const canPurchase =
    !!plan &&
    !loading &&
    !(payMethod === "wallet" && walletBal < (plan?.price || 0)) &&
    !((category === "data" || category === "airtime") && (!phone || phone.length < 10)) &&
    !(category === "cable" && !smartcard);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--color-page-bg)" }}>

      {/* ── Header ── */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site px-3 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
            <h1 className="font-semibold text-neutral-900 text-base leading-none">Digital Services</h1>
          </div>

          {/* Wallet Balance */}
          <Link
            href="/digital/wallet"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border transition-colors"
            style={{ backgroundColor: "rgba(217,140,42,0.1)", borderColor: "rgba(217,140,42,0.2)" }}
          >
            <Wallet className="w-3.5 h-3.5" style={{ color: "#d98c2a" }} />
            <span className="text-xs font-semibold" style={{ color: "#d98c2a" }}>{fmt(walletBal)}</span>
          </Link>
        </div>
      </div>

      {/* ── Persistent category navigation ── */}
      <CategoryTabs active={activeTab} onChange={handleTabClick} />

      {/* ── Unlinked-promo banner — only shows when the promo the user just
           tapped has no specific plan attached (an admin-allowed "general
           promo" with providerPlanId left blank). Names the deal and gives
           one clear next step instead of leaving them stuck on the full
           plan grid with no explanation. ── */}
      {unlinkedPromo && (
        <div className="container-site px-3 sm:px-6 pt-3">
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-sm"
            style={{ backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)" }}
          >
            <Gift className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#6366f1" }} />
            <div className="min-w-0">
              <p className="font-semibold text-neutral-900 leading-snug">
                "{unlinkedPromo.title}" isn't tied to one specific plan.
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 leading-snug">
                Tap the matching plan below{unlinkedPromo.network ? ` for ${unlinkedPromo.network.toUpperCase()}` : ""} to continue to checkout.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="container-site px-3 sm:px-6 py-3 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* Main column */}
          <div className="lg:col-span-2">
            {activeTab === "overview" && (
              <OverviewTab onSelectTab={handleTabClick} onSelectPromo={selectPromo} />
            )}

            {activeTab === "data" && (
              <DataTab
                network={network} onNetworkChange={handleDataNetworkChange}
                phone={phone} setPhone={setPhone}
                plans={plans} planLoad={planLoad} planError={planError}
                plan={plan} setPlan={handleSetPlan}
                onRetry={() => network && fetchPlans("data", network)}
                onPlanSelect={() => setSheetMounted(true)}
                onSelectPromo={selectPromo}
              />
            )}

            {activeTab === "airtime" && (
              <AirtimeTab
                network={network} onNetworkChange={handleAirtimeNetworkChange}
                phone={phone} setPhone={setPhone}
                plans={plans} planLoad={planLoad}
                plan={plan} setPlan={handleSetPlan}
                onPlanSelect={() => setSheetMounted(true)}
              />
            )}

            {activeTab === "cable" && (
              <CableTab
                cableProv={cableProv} setCableProv={setCableProv}
                smartcard={smartcard} setSmartcard={setSmartcard}
                plans={plans} planLoad={planLoad}
                plan={plan} setPlan={handleSetPlan}
              />
            )}

            {activeTab === "education" && (
              <EducationTab plans={plans} planLoad={planLoad} plan={plan} setPlan={handleSetPlan} />
            )}

            {activeTab === "deals" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" style={{ color: "#ef4444" }} />
                  <h2 className="font-display text-base font-semibold text-neutral-900">Hot Deals</h2>
                </div>
                <PromoGrid type="deal" onSelect={selectPromo} />
              </div>
            )}

            {activeTab === "promos" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="w-4 h-4" style={{ color: "#6366f1" }} />
                  <h2 className="font-display text-base font-semibold text-neutral-900">Promo Products</h2>
                </div>
                <PromoGrid type="promo" onSelect={selectPromo} />
              </div>
            )}

            {activeTab === "other" && <OtherTab />}
          </div>

          {/* Order summary column — desktop only; mobile uses the bottom sheet */}
          <div className="hidden lg:block lg:col-span-1">
            {plan ? (
              <div className="lg:sticky lg:top-24">
                <OrderSummaryPanel
                  plan={plan}
                  phone={phone}
                  payMethod={payMethod} setPayMethod={setPayMethod}
                  walletBal={walletBal}
                  loading={loading}
                  canPurchase={canPurchase}
                  onPurchase={handlePurchase}
                />
              </div>
            ) : (
              <div
                className="lg:sticky lg:top-24 rounded-2xl border border-dashed p-6 text-center text-sm text-neutral-400"
                style={{ borderColor: "var(--color-border, #e5e5e5)" }}
              >
                Select a plan to see your order summary here.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile confirm sheet — slides up the instant a plan is tapped,
           so the user goes straight to phone confirmation + payment
           without scrolling back to a general selection page. ── */}
      {plan && !result && (
        <div className="lg:hidden">
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/40 transition-opacity",
              sheetOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setSheetMounted(false)}
          />
          <div
            className={cn(
              "fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl transition-transform duration-200 max-h-[88vh] overflow-y-auto max-w-full overflow-x-hidden",
              sheetOpen ? "translate-y-0" : "translate-y-full"
            )}
            style={{ backgroundColor: "var(--color-card-bg, #fff)" }}
          >
            <div className="flex justify-center pt-2 pb-1">
              <span className="w-9 h-1 rounded-full bg-neutral-300" />
            </div>
            <OrderSummaryPanel
              plan={plan}
              phone={phone}
              payMethod={payMethod} setPayMethod={setPayMethod}
              walletBal={walletBal}
              loading={loading}
              canPurchase={canPurchase}
              onPurchase={handlePurchase}
              onClose={() => setSheetMounted(false)}
            />
          </div>
        </div>
      )}

      <ResultModal result={result} onClose={closeResult} />
    </div>
  );
}
