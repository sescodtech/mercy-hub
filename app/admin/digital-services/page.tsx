"use client";

/**
 * app/admin/digital-services/page.tsx
 * Admin Digital Services control center — Dashboard, Transactions, Hot Deals & Promos,
 * Plans & Pricing, Wallets, Providers & Diagnostics, and Reports.
 */

import { useState } from "react";
import {
  LayoutDashboard, Receipt, Sparkles, Settings2, Wallet, Activity, FileBarChart,
} from "lucide-react";

import { DashboardTab }    from "./components/DashboardTab";
import { TransactionsTab } from "./components/TransactionsTab";
import { PromosTab }       from "./components/PromosTab";
import { PlansPricingTab } from "./components/PlansPricingTab";
import { WalletsTab }      from "./components/WalletsTab";
import { DiagnosticsTab }  from "./components/DiagnosticsTab";
import { ReportsTab }      from "./components/ReportsTab";

type Tab = "dashboard" | "transactions" | "promos" | "plans" | "wallets" | "diagnostics" | "reports";

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard",    label: "Dashboard",             icon: LayoutDashboard },
  { id: "transactions", label: "Transactions",          icon: Receipt },
  { id: "promos",       label: "Hot Deals & Promos",    icon: Sparkles },
  { id: "plans",        label: "Plans & Pricing",       icon: Settings2 },
  { id: "wallets",      label: "Wallets",                icon: Wallet },
  { id: "diagnostics",  label: "Providers & Diagnostics", icon: Activity },
  { id: "reports",      label: "Reports",                icon: FileBarChart },
];

export default function AdminDigitalPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Digital Services</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Complete control center for data, airtime, cable TV, and education services</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dashboard"    && <DashboardTab />}
      {tab === "transactions" && <TransactionsTab />}
      {tab === "promos"       && <PromosTab />}
      {tab === "plans"        && <PlansPricingTab />}
      {tab === "wallets"      && <WalletsTab />}
      {tab === "diagnostics"  && <DiagnosticsTab />}
      {tab === "reports"      && <ReportsTab />}
    </div>
  );
}
