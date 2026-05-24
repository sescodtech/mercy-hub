"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus, Search, Filter, Trash2, Edit2, Eye, EyeOff,
  Star, Package, Upload, X, ChevronLeft, ChevronRight,
  Loader2, ImageIcon, ArrowUpDown, Check,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { formatPrice, cn } from "@/utils";

interface Category { _id: string; name: string; slug: string }
interface ProductImage { url: string; publicId?: string; alt?: string; isFeatured?: boolean }
interface Variant { name: string; value: string; price: number; stock: number }
interface Product {
  _id: string; name: string; slug: string; price: number; comparePrice?: number;
  images: ProductImage[]; category: Category | string; stock: number;
  isActive: boolean; isFeatured: boolean; isNewArrival: boolean;
  sku?: string; rating: number; reviewCount: number; createdAt: string;
}

const EMPTY = {
  name: "", description: "", shortDescription: "", price: "",
  comparePrice: "", sku: "", weight: "", stock: "0",
  lowStockThreshold: "5", trackInventory: true,
  isActive: true, isFeatured: false, isNewArrival: false,
  category: "", tags: "",
  images: [] as ProductImage[],
  variants: [] as Variant[],
};

export default function AdminProductsPage() {
  const [products,    setProducts]   = useState<Product[]>([]);
  const [categories,  setCategories] = useState<Category[]>([]);
  const [loading,     setLoading]    = useState(true);
  const [page,        setPage]       = useState(1);
  const [pages,       setPages]      = useState(1);
  const [total,       setTotal]      = useState(0);
  const [search,      setSearch]     = useState("");
  const [catFilter,   setCatFilter]  = useState("");
  const [statusFilter,setStatusFilter] = useState("");
  const [showForm,    setShowForm]   = useState(false);
  const [editing,     setEditing]    = useState<Product | null>(null);
  const [form,        setForm]       = useState(EMPTY);
  const [saving,      setSaving]     = useState(false);
  const [uploading,   setUploading]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search)       params.set("search",   search);
      if (catFilter)    params.set("category", catFilter);
      if (statusFilter) params.set("status",   statusFilter);
      const { data } = await axios.get(`/api/admin/products?${params}`);
      if (data.success) {
        setProducts(data.data);
        setPages(data.pagination.pages);
        setTotal(data.pagination.total);
      }
    } finally { setLoading(false); }
  }, [page, search, catFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    axios.get("/api/categories").then(({ data }) => { if (data.success) setCategories(data.data); });
  }, []);

  const handleSearch = (v: string) => {
    setSearch(v); setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(load, 400);
  };

  // Image upload
  const uploadImages = async (files: FileList) => {
    if (form.images.length + files.length > 5) { toast.error("Maximum 5 images per product"); return; }
    setUploading(true);
    const uploads = Array.from(files).map(async (file) => {
      const fd = new FormData();
      fd.append("file", file); fd.append("folder", "products");
      const { data } = await axios.post("/api/upload", fd);
      return { url: data.url, publicId: data.publicId, isFeatured: form.images.length === 0 } as ProductImage;
    });
    try {
      const results = await Promise.all(uploads);
      setForm((f) => ({ ...f, images: [...f.images, ...results] }));
      toast.success(`${results.length} image(s) uploaded`);
    } catch { toast.error("Some uploads failed"); }
    finally { setUploading(false); }
  };

  const removeImage = async (i: number) => {
    const img = form.images[i];
    if (img.publicId) {
      try { await axios.delete("/api/upload", { data: { publicId: img.publicId } }); } catch { /* silent */ }
    }
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, j) => j !== i).map((img, j) => ({ ...img, isFeatured: j === 0 })),
    }));
  };

  const setFeatured = (i: number) => {
    setForm((f) => ({ ...f, images: f.images.map((img, j) => ({ ...img, isFeatured: j === i })) }));
  };

  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, { name: "Size", value: "", price: Number(f.price), stock: 0 }] }));
  const removeVariant = (i: number) => setForm((f) => ({ ...f, variants: f.variants.filter((_, j) => j !== i) }));
  const updateVariant = (i: number, key: keyof Variant, val: string | number) => {
    setForm((f) => { const vs = [...f.variants]; vs[i] = { ...vs[i], [key]: val }; return { ...f, variants: vs }; });
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openEdit   = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: "", shortDescription: "", sku: p.sku ?? "",
      price: String(p.price), comparePrice: String(p.comparePrice ?? ""),
      weight: "", stock: String(p.stock), lowStockThreshold: "5",
      trackInventory: true, isActive: p.isActive, isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival, category: typeof p.category === "object" ? p.category._id : p.category,
      tags: "", images: [...p.images], variants: [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    if (!form.name.trim() || !form.price || !form.category) { toast.error("Name, price, and category are required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price:            Number(form.price),
        comparePrice:     form.comparePrice ? Number(form.comparePrice) : undefined,
        stock:            Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        tags:             form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (editing) {
        await axios.put(`/api/admin/products/${editing._id}`, payload);
        toast.success("Product updated!");
      } else {
        await axios.post("/api/admin/products", payload);
        toast.success("Product created!");
      }
      setShowForm(false); setEditing(null); load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e.response?.data?.error ?? "Failed to save product");
    } finally { setSaving(false); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await axios.put(`/api/admin/products/${id}`, { isActive: !current });
      setProducts((ps) => ps.map((p) => p._id === id ? { ...p, isActive: !current } : p));
      toast.success(current ? "Product hidden" : "Product published");
    } catch { toast.error("Failed to update"); }
  };

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/admin/products/${id}`);
      setProducts((ps) => ps.filter((p) => p._id !== id));
      toast.success("Product deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Products</h1>
            <p className="text-sm text-neutral-400">{total} total products</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#d98c2a] text-white text-sm rounded-lg hover:bg-[#c47020]">
              <Plus className="w-4 h-4" /> Add Product
            </button>
            <Link href="/admin" className="text-sm text-[#d98c2a]">← Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-5">

        {/* Product Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-neutral-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-neutral-900 text-lg">{editing ? `Edit: ${editing.name}` : "New Product"}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); }}><X className="w-5 h-5 text-neutral-400" /></button>
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-8">
              {/* Left */}
              <div className="space-y-5">
                {/* Basic info */}
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Product Name *</label>
                    <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Premium Bedding Set" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="form-label">Short Description</label>
                    <input value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} placeholder="One-line product summary" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="form-label">Full Description</label>
                    <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Detailed product description…" className="form-input w-full resize-none" />
                  </div>
                </div>

                {/* Images */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label mb-0">Images (max 5)</label>
                    <button onClick={() => fileRef.current?.click()} disabled={uploading || form.images.length >= 5}
                      className="flex items-center gap-1.5 text-xs text-[#d98c2a] disabled:opacity-40">
                      {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      Upload
                    </button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => e.target.files && uploadImages(e.target.files)} />
                  <div className="grid grid-cols-5 gap-2">
                    {form.images.map((img, i) => (
                      <div key={i} className={cn("relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer", img.isFeatured ? "border-[#d98c2a]" : "border-neutral-200")}>
                        <Image src={img.url} alt={`Product ${i + 1}`} fill className="object-cover" sizes="80px" />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-end justify-center gap-1 pb-1 opacity-0 hover:opacity-100">
                          <button onClick={() => setFeatured(i)} title="Set as featured"
                            className="p-1 bg-[#d98c2a] rounded text-white"><Star className="w-3 h-3" /></button>
                          <button onClick={() => removeImage(i)} className="p-1 bg-red-500 rounded text-white"><X className="w-3 h-3" /></button>
                        </div>
                        {img.isFeatured && (
                          <div className="absolute top-1 left-1 bg-[#d98c2a] rounded px-1 text-[9px] text-white font-bold">MAIN</div>
                        )}
                      </div>
                    ))}
                    {form.images.length < 5 && (
                      <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="aspect-square rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center text-neutral-300 hover:border-[#d98c2a] hover:text-[#d98c2a] transition-colors">
                        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Click ★ to set main image. First image is default.</p>
                </div>

                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label mb-0">Variants (optional)</label>
                    <button onClick={addVariant} className="text-xs text-[#d98c2a] flex items-center gap-1"><Plus className="w-3 h-3" />Add variant</button>
                  </div>
                  {form.variants.map((v, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <input value={v.name}  onChange={(e) => updateVariant(i, "name",  e.target.value)} placeholder="Name (e.g. Size)" className="form-input flex-1 text-xs" />
                      <input value={v.value} onChange={(e) => updateVariant(i, "value", e.target.value)} placeholder="Value (e.g. Large)" className="form-input flex-1 text-xs" />
                      <input value={v.price} onChange={(e) => updateVariant(i, "price", Number(e.target.value))} type="number" placeholder="Price" className="form-input w-24 text-xs" />
                      <input value={v.stock} onChange={(e) => updateVariant(i, "stock", Number(e.target.value))} type="number" placeholder="Stock" className="form-input w-20 text-xs" />
                      <button onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-4">
                {/* Pricing */}
                <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-700">Pricing</h3>
                  <div>
                    <label className="form-label">Price (₦) *</label>
                    <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="form-label">Compare Price (₦)</label>
                    <input type="number" value={form.comparePrice} onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))} placeholder="Strikethrough price" className="form-input w-full" />
                  </div>
                </div>

                {/* Inventory */}
                <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-700">Inventory</h3>
                  <div>
                    <label className="form-label">SKU</label>
                    <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="MHE-001" className="form-input w-full font-mono" />
                  </div>
                  <div>
                    <label className="form-label">Stock Quantity</label>
                    <input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} placeholder="0" className="form-input w-full" />
                  </div>
                  <div>
                    <label className="form-label">Low Stock Alert At</label>
                    <input type="number" value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} className="form-input w-full" />
                  </div>
                </div>

                {/* Organisation */}
                <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-700">Organisation</h3>
                  <div>
                    <label className="form-label">Category *</label>
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="form-input w-full">
                      <option value="">Select category…</option>
                      {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Tags (comma-separated)</label>
                    <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="bedroom, luxury, gift" className="form-input w-full" />
                  </div>
                </div>

                {/* Status */}
                <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-700">Status</h3>
                  {[
                    { key: "isActive",     label: "Published (visible in shop)" },
                    { key: "isFeatured",   label: "Featured product" },
                    { key: "isNewArrival", label: "New arrival badge" },
                    { key: "trackInventory", label: "Track inventory" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                      <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                        (form as Record<string, unknown>)[key] ? "bg-[#d98c2a] border-[#d98c2a]" : "border-neutral-300")}
                        onClick={() => setForm((f) => ({ ...f, [key]: !(f as Record<string, unknown>)[key] }))}>
                        {(form as Record<string, unknown>)[key] && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-sm text-neutral-700">{label}</span>
                    </label>
                  ))}
                </div>

                <button onClick={save} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? "Saving…" : editing ? "Update Product" : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search products…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg outline-none focus:border-[#d98c2a]" />
          </div>
          <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
            className="text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] bg-white">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] bg-white">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low">Low stock</option>
          </select>
        </div>

        {/* Products table */}
        <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {["Product", "Category", "Price", "Stock", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-medium text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-neutral-100 rounded animate-pulse" /></td>)}</tr>
                  ))
                ) : products.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-14 text-center">
                    <Package className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                    <p className="text-neutral-400">No products found.</p>
                    <button onClick={openCreate} className="mt-3 text-sm text-[#d98c2a] hover:underline">Add your first product</button>
                  </td></tr>
                ) : products.map((p) => {
                  const img = p.images?.[0]?.url;
                  const cat = typeof p.category === "object" ? p.category.name : "—";
                  return (
                    <tr key={p._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                            {img ? <Image src={img} alt={p.name} width={40} height={40} className="object-cover w-full h-full" /> : <Package className="w-5 h-5 text-neutral-300 m-auto mt-2.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-900 truncate max-w-[180px]">{p.name}</p>
                            {p.sku && <p className="text-xs text-neutral-400 font-mono">{p.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 text-xs">{cat}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-neutral-900">{formatPrice(p.price)}</p>
                        {p.comparePrice && <p className="text-xs text-neutral-400 line-through">{formatPrice(p.comparePrice)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-sm font-medium", p.stock === 0 ? "text-red-500" : p.stock <= 5 ? "text-orange-500" : "text-neutral-700")}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                            p.isActive ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", p.isActive ? "bg-green-500" : "bg-neutral-400")} />
                            {p.isActive ? "Active" : "Hidden"}
                          </span>
                          {p.isFeatured && <span className="text-[10px] text-[#d98c2a] font-medium flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />Featured</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => toggleActive(p._id, p.isActive)} title={p.isActive ? "Hide product" : "Publish product"}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700">
                            {p.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-[#d98c2a]">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => del(p._id, p.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-neutral-100">
              <p className="text-xs text-neutral-400">Page {page} of {pages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                  className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center disabled:opacity-40 hover:border-[#d98c2a]">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page === pages}
                  className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center disabled:opacity-40 hover:border-[#d98c2a]">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
