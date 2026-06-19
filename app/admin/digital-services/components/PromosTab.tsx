"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Sparkles, Gift, RefreshCw, Search } from "lucide-react";

interface Promo {
  _id: string;
  type: "deal" | "promo";
  title: string;
  subtitle?: string;
  category: string;
  badge?: string;
  network?: string;
  providerPlanId?: string;
  ctaLabel?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

interface PlanRow {
  id: string;
  label: string;
  meta: string;
  hidden: boolean;
}

type EditingPromo = Omit<Promo, "_id"> & { _id?: string };

const EMPTY: EditingPromo = {
  type: "deal", title: "", subtitle: "", category: "data", badge: "",
  network: "", providerPlanId: "", ctaLabel: "", imageUrl: "", isActive: true, sortOrder: 0,
};

export function PromosTab() {
  const [type,    setType]    = useState<"deal" | "promo">("deal");
  const [promos,  setPromos]  = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingPromo | null>(null);
  const [saving,  setSaving]  = useState(false);

  // Plan selection states
  const [planSelectionOpen, setPlanSelectionOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanRow | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planCategory, setPlanCategory] = useState<"data" | "airtime" | "cable">("data");

  useEffect(() => { fetchPromos(); }, []);

  async function fetchPromos() {
    setLoading(true);
    const r = await fetch("/api/admin/digital/promos");
    const d = await r.json();
    if (d.success) setPromos(d.data);
    setLoading(false);
  }

  // Fetch plans for selection modal
  async function fetchPlansForSelection() {
    if (planCategory === "data" || planCategory === "airtime" || planCategory === "cable") {
      setPlansLoading(true);
      try {
        const r = await fetch(`/api/admin/digital/plans?category=${planCategory}`);
        const d = await r.json();
        if (d.success) setPlans(d.data);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setPlansLoading(false);
      }
    }
  }

  async function save() {
    if (!editing || !editing.title) return;
    setSaving(true);
    const isNew = !editing._id;
    const url = isNew ? "/api/admin/digital/promos" : `/api/admin/digital/promos/${editing._id}`;
    const method = isNew ? "POST" : "PATCH";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    const d = await r.json();
    if (d.success) { setEditing(null); fetchPromos(); }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this promo? This can't be undone.")) return;
    const r = await fetch(`/api/admin/digital/promos/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.success) fetchPromos();
  }

  async function toggleActive(p: Promo) {
    await fetch(`/api/admin/digital/promos/${p._id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    fetchPromos();
  }

  // Handle plan selection
  const handlePlanSelect = (plan: PlanRow) => {
    setSelectedPlan(plan);
    // When a plan is selected, populate the promo fields
    if (editing) {
      const updates: Partial<EditingPromo> = {};

      // Set category based on plan type
      if (planCategory === "data") updates.category = "data";
      else if (planCategory === "airtime") updates.category = "airtime";
      else if (planCategory === "cable") updates.category = "cable";

      // Set network from plan meta (extract from meta like "MTN · 30 days")
      if (plan.meta) {
        const networkMatch = plan.meta.match(/^(MTN|AIRTEL|GLO|9MOBILE)/i);
        if (networkMatch) {
          updates.network = networkMatch[0].toLowerCase() as "mtn" | "airtel" | "glo" | "9mobile";
        }
      }

      // Set providerPlanId
      updates.providerPlanId = plan.id;

      // Generate a title if not already set
      if (!editing.title || editing.title.trim() === "") {
        updates.title = plan.label;
      }

      setEditing({ ...editing, ...updates });
    }
    setPlanSelectionOpen(false);
  };

  const handleOpenPlanSelection = () => {
    setPlanSelectionOpen(true);
    // Fetch plans for the current category when opening
    fetchPlansForSelection();
  };

  const filtered = promos.filter((p) => p.type === type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
          <button onClick={() => setType("deal")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${type === "deal" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>
            <Sparkles className="w-3.5 h-3.5" /> Hot Deals
          </button>
          <button onClick={() => setType("promo")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${type === "promo" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}>
            <Gift className="w-3.5 h-3.5" /> Promo Products
          </button>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setEditing({ ...EMPTY, type })}
            className="flex items-center gap-2 bg-[#c47020] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#a3551c]">
            <Plus className="w-4 h-4" /> Add {type === "deal" ? "Deal" : "Promo Product"}
          </button>
          {/* Plan selection button - only show when creating/editing a promo */}
          {editing && (
            <button onClick={handleOpenPlanSelection}
              className="flex items-center gap-2 bg-[#d98c2a] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#b87020]">
              <Search className="w-4 h-4" /> Select from Plans
            </button>
          )}
        </div>
      </div>

      {/* Inline create/edit form */}
      {editing && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">{editing._id ? "Edit" : "New"} {editing.type === "deal" ? "Hot Deal" : "Promo Product"}</h3>
            <button onClick={() => setEditing(null)} className="text-neutral-400 hover:text-neutral-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Title *</label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" placeholder="e.g. 2GB MTN — Weekend Special" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Badge</label>
              <input value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" placeholder="e.g. Hot, Limited Time" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Subtitle</label>
              <input value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" placeholder="Short supporting line" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Category *</label>
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]">
                <option value="data">Data</option>
                <option value="airtime">Airtime</option>
                <option value="cable">Cable TV</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Network / Provider</label>
              <input value={editing.network} onChange={(e) => setEditing({ ...editing, network: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" placeholder="mtn / airtel / dstv… (if applicable)" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Provider Plan ID</label>
              <input value={editing.providerPlanId} onChange={(e) => setEditing({ ...editing, providerPlanId: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" placeholder="Optional — links this card to a real plan so price is always live and accurate" />
              <p className="text-xs text-neutral-400 mt-1">
                Find the exact plan ID from the Plans &amp; Pricing tab. Leave blank for a general promo banner with no specific plan attached.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">CTA Label</label>
              <input value={editing.ctaLabel} onChange={(e) => setEditing({ ...editing, ctaLabel: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" placeholder="Buy Now (default)" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Sort Order</label>
              <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              Active (visible on storefront)
            </label>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50">Cancel</button>
              <button onClick={save} disabled={saving || !editing.title}
                className="flex items-center gap-2 bg-[#c47020] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#a3551c] disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selection Modal */}
      {planSelectionOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center max-w-md w-full relative">
            <button onClick={() => setPlanSelectionOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700">
              <X className="w-4 h-4" />
            </button>

            <h2 className="font-semibold text-neutral-900 text-xl mb-4">
              Select {planCategory === "data" ? "Data Plan" : planCategory === "airtime" ? "Airtime Amount" : "Cable Plan"}
            </h2>

            {plansLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#d98c2a]" />
              </div>
            ) : plans.length === 0 ? (
              <p className="text-neutral-500 text-sm">
                No {planCategory === "data" ? "data plans" : planCategory === "airtime" ? "airtime amounts" : "cable plans"} available.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search plans..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:border-[#d98c2a]"
                  />
                </div>

                {/* Plans List */}
                <div className="max-h-[400px] overflow-y-auto border border-neutral-100 rounded-xl">
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-800">{plan.label}</p>
                        <p className="text-xs text-neutral-500">{plan.meta}</p>
                      </div>
                      <button onClick={() => handlePlanSelect(plan)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${selectedPlan?.planId === plan.id ? "bg-[#d98c2a] text-white" : "border border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-neutral-100">
              <button onClick={() => setPlanSelectionOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-50">
                Cancel
              </button>
              {selectedPlan && (
                <button onClick={() => {
                  handlePlanSelect(selectedPlan);
                  setPlanSelectionOpen(false);
                }}
                  className="ml-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#c47020] text-white hover:bg-[#a3551c]">
                  <Search className="w-4 h-4" /> Use Selected Plan
                </button>
              }))}
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#d98c2a]" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-sm">No {type === "deal" ? "hot deals" : "promo products"} yet — add one above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Badge</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((p) => (
                <tr key={p._id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-800">{p.title}</p>
                    {p.subtitle && <p className="text-xs text-neutral-400">{p.subtitle}</p>}
                  </td>
                  <td className="px-4 py-3 capitalize text-neutral-600">{p.category}</td>
                  <td className="px-4 py-3 text-neutral-600">{p.badge || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${p.isActive ? "bg-[#d98c2a]" : "bg-neutral-200"}`}>
                      <span
                        className={`inline-block w-3.5 h-3.5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${p.isActive ? "translate-x-5" : "translate-x-0.5"}`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setEditing(p)} className="text-neutral-400 hover:text-neutral-700"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(p._id)} className="text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
