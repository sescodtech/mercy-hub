"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface PlanRow { id: string; label: string; meta: string; hidden: boolean }

export function PlanVisibility() {
  const [category, setCategory] = useState<"data" | "airtime" | "cable">("data");
  const [plans,    setPlans]    = useState<PlanRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => { load(); }, [category]);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/admin/digital/plans?category=${category}`);
    const d = await r.json();
    if (d.success) setPlans(d.data);
    setLoading(false);
  }

  async function toggle(p: PlanRow) {
    setToggling(p.id);
    await fetch("/api/admin/digital/plans", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: p.id, hidden: !p.hidden }),
    });
    setPlans((prev) => prev.map((x) => (x.id === p.id ? { ...x, hidden: !x.hidden } : x)));
    setToggling(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6">
      <h2 className="font-semibold text-neutral-900 mb-1">Plans Management</h2>
      <p className="text-sm text-neutral-400 mb-4">Hide specific plans from the storefront without affecting pricing for the rest. Useful when a particular bundle is out of stock with the provider.</p>

      <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit mb-4">
        {(["data", "airtime", "cable"] as const).map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${category === c ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#d98c2a]" /></div>
      ) : plans.length === 0 ? (
        <p className="text-sm text-neutral-400 py-6 text-center">No live plans returned by the provider right now.</p>
      ) : (
        <div className="max-h-80 overflow-y-auto divide-y divide-neutral-50 border border-neutral-100 rounded-xl">
          {plans.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">{p.label}</p>
                <p className="text-xs text-neutral-400">{p.meta} · <span className="font-mono">{p.id}</span></p>
              </div>
              <button onClick={() => toggle(p)} disabled={toggling === p.id}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 ml-3 ${!p.hidden ? "bg-[#d98c2a]" : "bg-neutral-200"}`}>
                <span className={`inline-block w-3.5 h-3.5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${!p.hidden ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
