"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";

interface EduPlan { id: string; examName: string; name: string; costPrice: number; quantity: number; isActive: boolean }

const EMPTY: Omit<EduPlan, "id"> = { examName: "WAEC", name: "", costPrice: 0, quantity: 1, isActive: true };

export function EducationCatalog() {
  const [plans,    setPlans]    = useState<EduPlan[]>([]);
  const [supported,setSupported]= useState<string[]>(["WAEC", "NECO", "NABTEB"]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<(Omit<EduPlan, "id"> & { id?: string }) | null>(null);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/digital/education-plans");
    const d = await r.json();
    if (d.success) { setPlans(d.data); setSupported(d.supportedExams || supported); }
    setLoading(false);
  }

  async function save() {
    if (!editing || !editing.name || !editing.costPrice) return;
    setSaving(true);
    const isNew = !editing.id;
    const r = await fetch("/api/admin/digital/education-plans", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const d = await r.json();
    if (d.success) { setEditing(null); load(); } else { alert(d.error || "Failed to save"); }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Remove this exam pin product?")) return;
    const r = await fetch(`/api/admin/digital/education-plans?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.success) load();
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-neutral-900">Education / Exam PIN Catalog</h2>
        <button onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-1.5 text-sm font-medium text-[#d98c2a] hover:underline">
          <Plus className="w-3.5 h-3.5" /> Add Exam
        </button>
      </div>
      <p className="text-sm text-neutral-400 mb-4">
        The connected provider (GladTidings) only fulfills {supported.join(", ")} pins — that's why exam type is locked to these options.
      </p>

      {editing && (
        <div className="border border-neutral-200 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-800">{editing.id ? "Edit" : "New"} Exam Pin</p>
            <button onClick={() => setEditing(null)} className="text-neutral-400 hover:text-neutral-700"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Exam Type</label>
              <select value={editing.examName} onChange={(e) => setEditing({ ...editing, examName: e.target.value })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]">
                {supported.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Display Name</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="e.g. WAEC Result Checker"
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Cost Price (₦)</label>
              <input type="number" value={editing.costPrice} onChange={(e) => setEditing({ ...editing, costPrice: Number(e.target.value) })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Default Quantity</label>
              <input type="number" min={1} value={editing.quantity} onChange={(e) => setEditing({ ...editing, quantity: Number(e.target.value) })}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#d98c2a]" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              Active
            </label>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-[#c47020] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#a3551c] disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-[#d98c2a]" /></div>
      ) : (
        <div className="divide-y divide-neutral-50 border border-neutral-100 rounded-xl">
          {plans.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-neutral-800">{p.name} {!p.isActive && <span className="text-xs text-neutral-400">(inactive)</span>}</p>
                <p className="text-xs text-neutral-400">{p.examName} · cost ₦{p.costPrice.toLocaleString("en-NG")} · qty {p.quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(p)} className="text-neutral-400 hover:text-neutral-700"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(p.id)} className="text-neutral-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
