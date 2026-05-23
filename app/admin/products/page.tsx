"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Package } from "lucide-react";
import axios from "axios";
import { formatPrice, cn } from "@/utils";
import toast from "react-hot-toast";
import type { IProduct } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/products?limit=20&page=${page}${search ? `&search=${search}` : ""}`);
      if (data.success) {
        setProducts(data.data);
        setTotal(data.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await axios.patch(`/api/products/${id}`, { isActive: !current });
      setProducts((ps) => ps.map((p) => p._id === id ? { ...p, isActive: !current } : p));
      toast.success(current ? "Product hidden" : "Product published");
    } catch {
      toast.error("Failed to update product");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts((ps) => ps.filter((p) => p._id !== id));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Products</h1>
          <p className="text-sm text-neutral-400">{total} total products</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-neutral-100 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search products…"
            className="pl-9 pr-4 py-2.5 text-sm rounded-lg border border-neutral-200 w-full outline-none focus:border-brand-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                {["Product", "SKU", "Price", "Stock", "Status", "Featured", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 skeleton rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Package className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                    <p className="text-neutral-400">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-neutral-50 transition-colors">
                    {/* Product */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                          {product.images?.[0]?.url && (
                            <Image src={product.images[0].url} alt={product.name} fill className="object-cover" sizes="40px" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-800 line-clamp-1 max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-neutral-400">
                            {typeof product.category === "object" ? product.category?.name : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">{product.sku}</td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900">{formatPrice(product.price)}</p>
                      {product.comparePrice && (
                        <p className="text-xs text-neutral-400 line-through">{formatPrice(product.comparePrice)}</p>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs font-medium",
                        product.stock === 0 ? "text-red-500" :
                        product.stock <= product.lowStockThreshold ? "text-orange-500" : "text-green-600"
                      )}>
                        {product.stock === 0 ? "Out of Stock" : `${product.stock} units`}
                      </span>
                    </td>

                    {/* Active */}
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(product._id, product.isActive)} className="flex items-center gap-1.5 text-xs">
                        {product.isActive
                          ? <><ToggleRight className="w-5 h-5 text-green-500" /><span className="text-green-600">Active</span></>
                          : <><ToggleLeft className="w-5 h-5 text-neutral-400" /><span className="text-neutral-400">Hidden</span></>
                        }
                      </button>
                    </td>

                    {/* Featured */}
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-medium", product.isFeatured ? "text-brand-600" : "text-neutral-400")}>
                        {product.isFeatured ? "Yes" : "No"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/products/${product._id}/edit`} className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-500 hover:text-brand-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => deleteProduct(product._id)} className="p-1.5 rounded-md hover:bg-red-50 text-neutral-500 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
