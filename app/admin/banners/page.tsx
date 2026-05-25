"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Plus, Trash2, Upload, ToggleLeft, ToggleRight, GripVertical, Loader2, Edit2, X, Check } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  link: string;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY = { title: "", subtitle: "", image: "", buttonText: "Shop Now", link: "/shop" };

export default function AdminBannersPage() {
  const [banners,   setBanners]   = useState<Banner[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState<Banner | null>(null);
  const [form,      setForm]      = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/banners");
      if (data.success) setBanners(data.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "banners");
      const { data } = await axios.post("/api/upload", fd);
      if (data.success) { setForm((f) => ({ ...f, image: data.url })); toast.success("Image uploaded!"); }
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title || !form.image) { toast.error("Title and image required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await axios.patch(`/api/banners/${editing._id}`, form);
        toast.success("Banner updated!");
      } else {
        await axios.post("/api/banners", { ...form, sortOrder: banners.length });
        toast.success("Banner created!");
      }
      setShowForm(false); setEditing(null); setForm(EMPTY); load();
    } catch { toast.error("Failed to save banner"); }
    finally { setSaving(false); }
  };

  const toggle = async (id: string, current: boolean) => {
    try {
      await axios.patch(`/api/banners/${id}`, { isActive: !current });
      setBanners((bs) => bs.map((b) => b._id === id ? { ...b, isActive: !current } : b));
    } catch { toast.error("Failed to update"); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await axios.delete(`/api/banners/${id}`);
      setBanners((bs) => bs.filter((b) => b._id !== id));
      toast.success("Banner deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const startEdit = (b: Banner) => {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle, image: b.image, buttonText: b.buttonText, link: b.link });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Banners</h1>
          <p className="text-sm text-neutral-400">{banners.length} banner{banners.length !== 1 ? "s" : ""} — shown on homepage hero</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#d98c2a] text-white text-sm rounded-lg hover:bg-[#c47020]">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-neutral-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-neutral-900">{editing ? "Edit Banner" : "New Banner"}</h2>
            <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}>
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
          <div className="space-y-4">
            {/* Image */}
            <div>
              <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-2">Banner Image *</label>
              <div className="relative aspect-[21/9] max-h-52 bg-neutral-100 rounded-xl overflow-hidden border-2 border-dashed border-neutral-200 cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                {form.image
                  ? <Image src={form.image} alt="Preview" fill className="object-cover" />
                  : <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                      {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Upload className="w-8 h-8 mb-2" /><p className="text-sm">Click to upload (1440×600px recommended)</p></>}
                    </div>
                }
                {form.image && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <span className="text-white text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4" />Change</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: "title",      label: "Title *",      placeholder: "Summer Collection",       full: true },
                { key: "subtitle",   label: "Subtitle",     placeholder: "Up to 30% off",           full: true },
                { key: "buttonText", label: "Button Text",  placeholder: "Shop Now",                full: false },
                { key: "link",       label: "Button Link",  placeholder: "/shop",                   full: false },
              ].map(({ key, label, placeholder, full }) => (
                <div key={key} className={full ? "sm:col-span-2" : ""}>
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">{label}</label>
                  <input type="text" value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#d98c2a] text-white text-sm rounded-lg hover:bg-[#c47020] disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Saving…" : editing ? "Update Banner" : "Create Banner"}
              </button>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY); }}
                className="px-5 py-2.5 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(2)].map((_, i) => <div key={i} className="h-28 bg-white rounded-xl border border-neutral-100 animate-pulse" />)
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-100 p-12 text-center">
            <p className="text-neutral-400 text-sm">No banners yet. Add your first banner.</p>
          </div>
        ) : banners.map((banner) => (
          <div key={banner._id} className="bg-white rounded-xl border border-neutral-100 overflow-hidden flex items-stretch">
            <div className="flex items-center px-3 text-neutral-300 cursor-grab">
              <GripVertical className="w-5 h-5" />
            </div>
            <div className="relative w-40 flex-shrink-0 bg-neutral-100">
              {banner.image
                ? <Image src={banner.image} alt={banner.title} fill className="object-cover" sizes="160px" />
                : <div className="absolute inset-0 flex items-center justify-center text-neutral-300 text-xs">No image</div>}
            </div>
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">{banner.title}</h3>
                  {banner.subtitle && <p className="text-sm text-neutral-400 mt-0.5">{banner.subtitle}</p>}
                  <p className="text-xs text-neutral-300 mt-1">{banner.buttonText} → {banner.link}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggle(banner._id, banner.isActive)}>
                    {banner.isActive
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6 text-neutral-300" />}
                  </button>
                  <button onClick={() => startEdit(banner)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => del(banner._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
