"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Sparkles, Gift, Check, ChevronDown } from "lucide-react";

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

type EditingPromo = Omit<Promo, "_id"> & { _id?: string };

interface PlanRow { id: string; label: string; meta: string; hidden: boolean }

const EMPTY: EditingPromo = {
  type: "deal", title: "", subtitle: "", category: "data", badge: "",
  network: "", providerPlanId: "", ctaLabel: "", imageUrl: "", isActive: true, sortOrder: 0,
};

// Categories that are backed by a real, selectable provider plan.
// "other" promos are just banners with no live plan attached.
const PLAN_BACKED_CATEGORIES = ["data", "airtime", "cable"] as const;

export function PromosTab() {
  const [type,    setType]    = useState<"deal" | "promo">("deal");
  const [promos,  setPromos]  = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingPromo | null>(null);
  const [saving,  setSaving]  = useState(false);

  // Live plan picker state
  const [planCategory, setPlanCategory] = useState<"data" | "airtime" | "cable">("data");
  const [availablePlans, setAvailablePlans] = useState<PlanRow[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => { fetchPromos(); }, []);

  async function fetchPromos() {
    setLoading(true);
    const r = await fetch("/api/admin/digital/promos");
    const d = await r.json();
    if (d.success) setPromos(d.data);
    setLoading(false);
  }

  // Load live plans whenever the picker's category changes (while the form is open)
  useEffect(() => {
    if (!editing) return;
    if (!PLAN_BACKED_CATEGORIES.includes(planCategory)) return;
    let alive = true;
    setPlansLoading(true);
    fetch(`/api/admin/digital/plans?category=${planCategory}`)
      .then((r) => r.json())
      .then((d) => { if (alive && d.success) setAvailablePlans(d.data); })
      .finally(() => { if (alive) setPlansLoading(false); });
    return () => { alive = false; };
  }, [planCategory, editing]);

  // When opening the form for an existing plan-backed promo, default the picker's
  // category tab to match so the right plan list loads automatically.
  function openEditor(p: EditingPromo) {
    setEditing(p);
    setPickerOpen(false);
    if (PLAN_BACKED_CATEGORIES.includes(p.category as typeof PLAN_BACKED_CATEGORIES[number])) {
      setPlanCategory(p.category as typeof PLAN_BACKED_CATEGORIES[number]);
    } else {
      setPlanCategory("data");
    }
  }

  function pickPlan(p: PlanRow) {
    if (!editing) return;
    // meta looks like "MTN · 30 days" or "DSTV" — pull the network token out of it
    // for data/airtime so the storefront flow knows which network tab to land on.
    const networkToken = p.meta.split("·")[0].trim().toLowerCase();
    const isKnownNetwork = ["mtn", "airtel", "glo", "9mobile"].includes(networkToken);

    setEditing({
      ...editing,
      category: planCategory,
      providerPlanId: p.id,
      network: isKnownNetwork ? networkToken : (planCategory === "cable" ? p.meta.toLowerCase() : editing.network),
      title: editing.title || p.label,
    });
    setPickerOpen(false);
  }

  function clearPlan() {
    if (!editing) return;
    setEditing({ ...editing, providerPlanId: "" });
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

  const filtered = promos.filter((p) => p.type === type);
  const isPlanBackedCategory = editing ? PLAN_BACKED_CATEGORIES.includes(editing.category as typeof PLAN_BACKED_CATEGORIES[number]) : false;
  const selectedPlan = editing?.providerPlanId
    ? availablePlans.find((p) => p.id === editing.providerPlanId)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
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
        <button onClick={() => openEditor({ ...EMPTY, type })}
          className="flex items-center gap-2 bg-[#c47020] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#a3551c]">
          <Plus className="w-4 h-4" /> Add {type === "deal" ? "Deal" : "Promo Product"}
        </button>
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
              <label className="block text-xs font-medium text-neutral-500 mb-1">Category *</label>
              <select value={editing.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  setEditing({ ...editing, category: cat, providerPlanId: "", network: "" });
                  if (PLAN_BACKED_CATEGORIES.includes(cat as typeof PLAN_BACKED_CATEGORIES[number])) {
                    setPlanCategory(cat as typeof PLAN_BACKED_CATEGORIES[number]);
                  }
                }}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]">
                <option value="data">Data</option>
                <option value="airtime">Airtime</option>
                <option value="cable">Cable TV</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Badge</label>
              <input value={editing.badge} onChange={(e) => setEditing({ ...editing, badge: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" placeholder="e.g. Hot, Limited Time" />
            </div>

            {/* ── Live plan picker — replaces the old free-text Provider Plan ID field ── */}
            {isPlanBackedCategory && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-neutral-500 mb-1">Data Plan *</label>

                {selectedPlan ? (
                  <div className="flex items-center justify-between border border-[#d98c2a] bg-[#fff7ed] rounded-lg px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{selectedPlan.label}</p>
                      <p className="text-xs text-neutral-500">{selectedPlan.meta}</p>
                    </div>
                    <button onClick={clearPlan} className="text-xs font-semibold text-neutral-500 hover:text-red-500 flex-shrink-0 ml-3">
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPickerOpen((v) => !v)}
                      className="w-full flex items-center justify-between border border-neutral-200 rounded-lg px-3 py-2.5 text-sm text-left text-neutral-500 hover:border-[#d98c2a]"
                    >
                      Select an available plan…
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    </button>

                    {pickerOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
                        {/* Sub-category tabs when the parent category itself isn't fixed enough
                            (data/airtime/cable share this picker UI) */}
                        <div className="flex gap-1 bg-neutral-50 p-2 border-b border-neutral-100">
                          {PLAN_BACKED_CATEGORIES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => { setPlanCategory(c); setEditing({ ...editing, category: c }); }}
                              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${planCategory === c ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>

                        <div className="max-h-64 overflow-y-auto divide-y divide-neutral-50">
                          {plansLoading ? (
                            <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-[#d98c2a]" /></div>
                          ) : availablePlans.length === 0 ? (
                            <p className="text-sm text-neutral-400 text-center py-6">No live plans returned by the provider right now.</p>
                          ) : (
                            availablePlans.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => pickPlan(p)}
                                disabled={p.hidden}
                                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-neutral-800 truncate">{p.label}</p>
                                  <p className="text-xs text-neutral-400">{p.meta}{p.hidden ? " · hidden from storefront" : ""}</p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-neutral-400 mt-1">
                  Pick the exact plan this {editing.type === "deal" ? "Hot Deal" : "Promo Product"} should sell. The price shown to customers always comes live from this plan.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Title *</label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" placeholder="e.g. 2GB MTN — Weekend Special" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Subtitle</label>
              <input value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" placeholder="Short supporting line" />
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
              <button onClick={save} disabled={saving || !editing.title || (isPlanBackedCategory && !editing.providerPlanId)}
                className="flex items-center gap-2 bg-[#c47020] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#a3551c] disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
              </button>
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Plan</th>
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
                  <td className="px-4 py-3 text-neutral-600">
                    {p.providerPlanId ? (
                      <span className="text-xs font-mono bg-neutral-100 px-1.5 py-0.5 rounded">{p.providerPlanId}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)}
                      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${p.isActive ? "bg-[#d98c2a]" : "bg-neutral-200"}`}>
                      <span className={`inline-block w-3.5 h-3.5 transform rounded-full bg-white shadow transition-transform mt-0.5 ${p.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEditor(p)} className="text-neutral-400 hover:text-neutral-700"><Pencil className="w-3.5 h-3.5" /></button>
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
