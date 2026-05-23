"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown, Search, Grid2X2, LayoutList } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/product/ProductSkeleton";
import type { IProduct, IPagination } from "@/types";
import { cn } from "@/utils";

const SORT_OPTIONS = [
  { label: "Newest",       value: "newest" },
  { label: "Price: Low",   value: "price_asc" },
  { label: "Price: High",  value: "price_desc" },
  { label: "Best Rated",   value: "rating" },
  { label: "Popular",      value: "popular" },
];

const CATEGORIES = [
  { label: "All",          value: "" },
  { label: "Bedding",      value: "bedding" },
  { label: "Kitchenware",  value: "kitchenware" },
  { label: "Home Decor",   value: "home-decor" },
  { label: "Bath & Body",  value: "bath-body" },
  { label: "Lighting",     value: "lighting" },
];

interface ShopClientProps {
  searchParams: Record<string, string>;
}

export function ShopClient({ searchParams }: ShopClientProps) {
  const router = useRouter();
  const urlParams = useSearchParams();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter state
  const [category, setCategory] = useState(searchParams.category ?? "");
  const [sort, setSort] = useState(searchParams.sort ?? "newest");
  const [minPrice, setMinPrice] = useState(searchParams.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice ?? "");
  const [inStock, setInStock] = useState(searchParams.inStock === "true");
  const [search, setSearch] = useState(searchParams.search ?? "");
  const [page, setPage] = useState(Number(searchParams.page ?? 1));
  const [view, setView] = useState<"grid" | "list">("grid");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category)  params.set("category",  category);
      if (sort)      params.set("sort",       sort);
      if (minPrice)  params.set("minPrice",   minPrice);
      if (maxPrice)  params.set("maxPrice",   maxPrice);
      if (inStock)   params.set("inStock",    "true");
      if (search)    params.set("search",     search);
      params.set("page",  String(page));
      params.set("limit", "12");

      const { data } = await axios.get(`/api/products?${params.toString()}`);
      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, sort, minPrice, maxPrice, inStock, search, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const clearFilters = () => {
    setCategory(""); setSort("newest"); setMinPrice("");
    setMaxPrice(""); setInStock(false); setSearch(""); setPage(1);
  };

  const activeFiltersCount = [category, minPrice, maxPrice, inStock ? "1" : ""].filter(Boolean).length;

  return (
    <div className="bg-cream min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-8">
          <h1 className="font-display text-3xl font-semibold text-neutral-900">
            {category ? CATEGORIES.find((c) => c.value === category)?.label ?? "Products" : "All Products"}
          </h1>
          {pagination && (
            <p className="text-sm text-neutral-400 mt-1">
              {pagination.total} product{pagination.total !== 1 ? "s" : ""} found
            </p>
          )}
        </div>
      </div>

      <div className="container-site py-8">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all",
                category === cat.value
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-brand-400 hover:text-brand-600"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search products…"
                className="pl-9 pr-4 py-2 text-sm rounded-md border border-neutral-200 bg-white outline-none focus:border-brand-400 w-56"
              />
            </div>

            {/* Filter button */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-all",
                filterOpen || activeFiltersCount > 0
                  ? "bg-brand-50 border-brand-300 text-brand-700"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-neutral-400 hover:text-red-500 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="appearance-none pl-3 pr-8 py-2 text-sm rounded-md border border-neutral-200 bg-white outline-none focus:border-brand-400 cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="hidden sm:flex border border-neutral-200 rounded-md overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={cn("p-2 transition-colors", view === "grid" ? "bg-neutral-900 text-white" : "bg-white text-neutral-500 hover:bg-neutral-50")}
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("p-2 transition-colors", view === "list" ? "bg-neutral-900 text-white" : "bg-white text-neutral-500 hover:bg-neutral-50")}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-xl border border-neutral-100 p-6 grid sm:grid-cols-3 gap-6">
                {/* Price range */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500 block mb-3">
                    Price Range (₦)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="input-field"
                    />
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="input-field"
                    />
                  </div>
                </div>

                {/* In Stock */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500 block mb-3">
                    Availability
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="w-4 h-4 accent-brand-600"
                    />
                    <span className="text-sm text-neutral-700">In Stock Only</span>
                  </label>
                </div>

                {/* Apply */}
                <div className="flex items-end">
                  <button
                    onClick={() => { setPage(1); setFilterOpen(false); }}
                    className="btn-primary w-full justify-center"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products */}
        {loading ? (
          <ProductGridSkeleton count={12} />
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-2xl text-neutral-400 mb-4">No products found</p>
            <p className="text-sm text-neutral-400 mb-6">Try adjusting your filters or search terms.</p>
            <button onClick={clearFilters} className="btn-primary">Clear All Filters</button>
          </div>
        ) : (
          <div className={cn(
            view === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              : "grid grid-cols-1 gap-4"
          )}>
            {products.map((product, i) => (
              <ProductCard key={product._id} product={product} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={cn(
                  "w-10 h-10 rounded-md text-sm font-medium transition-all",
                  p === page
                    ? "bg-brand-600 text-white"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:border-brand-400"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
