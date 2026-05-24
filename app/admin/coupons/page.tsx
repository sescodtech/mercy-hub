"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, Copy } from "lucide-react";
import axios from "axios";
import { formatDate, cn } from "@/utils";
import toast from "react-hot-toast";

interface Coupon {
  _id: string;
  code: string;
  description?: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  usageCount: number;
  usageLimit?: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "", description: "", type: "percent", value: "",
    minOrderAmount: "", usageLimit: "", isActive: true,
    startDate: "", endDate: "",
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/coupons");
      if (data.success) setCoupons(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/admin/coupons", {
        ...form,
        code:           form.code.toUpperCase().trim(),
        value:          Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        usageLimit:     form.usageLimit ? Number(form.usageLimit) : undefined,
      });
      toast.success("Coupon created!");
      setShowForm(false);
      setForm({ code: "", description: "", type: "percent", value: "", minOrderAmount: "", usageLimit: "", isActive: true, startDate: "", endDate: "" });
      fetchCoupons();
    } catch {
      toast.error("Failed to create coupon");
    }
  };

  const toggleCoupon = async (id: string, current: boolean) => {
    try {
      await axios.patch(`/api/admin/coupons/${id}`, { isActive: !current });
      setCoupons((cs) => cs.map((c) => c._id === id ? { ...c, isActive: !current } : c));
      toast.success(current ? "Coupon deactivated" : "Coupon activated");
    } catch {
      toast.error("Failed to update coupon");
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await axios.delete(`/api/admin/coupons/${id}`);
      setCoupons((cs) => cs.filter((c) => c._id !== id));
      toast.success("Coupon deleted");
    } catch {
      toast.error("Failed to delete coupon");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const formatDiscount = (c: Coupon) => {
    if (c.type === "percent") return `${c.value}% off`;
    if (c.type === "fixed")   return `₦${c.value.toLocaleString()} off`;
    return "Free shipping";
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="bg-white border-b border-neutral-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Coupons</h1>
            <p className="text-sm text-neutral-400">{coupons.length} active codes</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-[#d98c2a] text-white text-sm rounded-lg hover:bg-[#c47020] transition-colors">
              <Plus className="w-4 h-4" /> New Coupon
            </button>
            <Link href="/admin" className="text-sm text-[#d98c2a]">← Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        {/* Create form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-neutral-100 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4">Create New Coupon</h2>
            <form onSubmit={createCoupon} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SAVE20"
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description"
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₦)</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              {form.type !== "free_shipping" && (
                <div>
                  <label className="text-xs font-medium text-neutral-600 block mb-1">
                    Value * {form.type === "percent" ? "(%)" : "(₦)"}
                  </label>
                  <input
                    type="number"
                    required
                    value={form.value}
                    onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                    placeholder={form.type === "percent" ? "e.g. 10" : "e.g. 2000"}
                    className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">Min Order Amount (₦)</label>
                <input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                  placeholder="e.g. 10000"
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">Usage Limit</label>
                <input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                  placeholder="Leave blank for unlimited"
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 block mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]"
                />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" className="px-6 py-2.5 bg-[#d98c2a] text-white text-sm rounded-lg hover:bg-[#c47020]">
                  Create Coupon
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coupons table */}
        <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {["Code", "Discount", "Min Order", "Usage", "Validity", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-medium text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 skeleton rounded" /></td>)}</tr>
                  ))
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <Tag className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                      <p className="text-neutral-400">No coupons yet. Create your first one!</p>
                    </td>
                  </tr>
                ) : coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">{coupon.code}</span>
                        <button onClick={() => copyCode(coupon.code)} className="text-neutral-400 hover:text-[#d98c2a]">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {coupon.description && <p className="text-xs text-neutral-400 mt-0.5">{coupon.description}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-[#d98c2a]">{formatDiscount(coupon)}</span>
                    </td>
                    <td className="px-5 py-4 text-neutral-600">
                      {coupon.minOrderAmount ? `₦${coupon.minOrderAmount.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-neutral-700">{coupon.usageCount}</span>
                      {coupon.usageLimit && <span className="text-neutral-400">/{coupon.usageLimit}</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-neutral-500">
                      {coupon.endDate ? `Until ${formatDate(coupon.endDate, { month: "short", day: "numeric" })}` : "No expiry"}
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleCoupon(coupon._id, coupon.isActive)} className="flex items-center gap-1.5 text-xs">
                        {coupon.isActive
                          ? <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600">Active</span></>
                          : <><ToggleLeft className="w-5 h-5 text-neutral-400" /><span className="text-neutral-400">Inactive</span></>
                        }
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => deleteCoupon(coupon._id)} className="p-1.5 rounded-md hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
