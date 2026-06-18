"use client";

import { useEffect, useState } from "react";
import { Wifi, Phone, Tv, BookOpen, Loader2 } from "lucide-react";
import { PlanVisibility } from "./PlanVisibility";
import { EducationCatalog } from "./EducationCatalog";

interface Config {
  markup: { data: number; airtime: number; cable: number; education: number };
  services: { data: boolean; airtime: boolean; cable: boolean; education: boolean };
}

const CAT_ICONS: Record<string, typeof Wifi> = { data: Wifi, airtime: Phone, cable: Tv, education: BookOpen };

export function PlansPricingTab() {
  const [config,  setConfig]  = useState<Config | null>(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  async function fetchConfig() {
    const r = await fetch("/api/admin/digital/markup");
    const d = await r.json();
    if (d.success) setConfig({ markup: d.markup, services: d.services });
  }

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    await fetch("/api/admin/digital/markup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
  }

  if (!config) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#d98c2a]" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Service toggles */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Services</h2>
        <p className="text-sm text-neutral-400 mb-5">Turn an entire category on or off storefront-wide — useful during provider outages.</p>
        <div className="grid grid-cols-2 gap-3">
          {(["data", "airtime", "cable", "education"] as const).map((cat) => {
            const Icon = CAT_ICONS[cat];
            return (
              <div key={cat} className="flex items-center justify-between border border-neutral-100 rounded-xl p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-4 h-4 text-neutral-600" />
                  </div>
                  <span className="font-medium text-neutral-800 capitalize">{cat}</span>
                </div>
                <button
                  onClick={() => setConfig((c) => c ? { ...c, services: { ...c.services, [cat]: !c.services[cat] } } : c)}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${config.services[cat] ? "bg-[#d98c2a]" : "bg-neutral-200"}`}>
                  <span className={`inline-block w-4 h-4 transform rounded-full bg-white shadow transition-transform mt-1 ${config.services[cat] ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Markup % */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Markup Percentages</h2>
        <p className="text-sm text-neutral-400 mb-5">Percentage added to GladTidings cost price for customer-facing prices.</p>
        <div className="grid grid-cols-2 gap-4">
          {(["data", "airtime", "cable", "education"] as const).map((cat) => (
            <div key={cat}>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5 capitalize">{cat}</label>
              <div className="relative">
                <input
                  type="number" min={0} max={100} value={config.markup[cat]}
                  onChange={(e) => setConfig((c) => c ? { ...c, markup: { ...c.markup, [cat]: Number(e.target.value) } } : c)}
                  className="w-full border border-neutral-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-[#d98c2a]"
                />
                <span className="absolute right-3 top-3 text-sm text-neutral-400">%</span>
              </div>
            </div>
          ))}
        </div>

        <button onClick={saveConfig} disabled={saving}
          className="mt-5 w-full bg-[#c47020] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#a3551c] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Settings"}
        </button>
      </div>

      <PlanVisibility />
      <EducationCatalog />
    </div>
  );
}
