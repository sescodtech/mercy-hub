"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, X, ChevronDown, Search,
  Grid2X2, LayoutList, Tag,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/product/ProductSkeleton";
import type { IProduct, IPagination } from "@/types";
import { cn, formatPrice } from "@/utils";

const SORT_OPTIONS = [
  { label: "Newest",      value: "newest" },
  { label: "Price: Low",  value: "price_asc" },
  { label: "Price: High", value: "price_desc" },
  { label: "Best Rated",  value: "rating" },
  { label: "Popular",     value: "popular" },
];

const CATEGORIES = [
  { label: "All",         value: "" },
  { label: "Bedding",     value: "bedding" },
  { label: "Kitchenware", value: "kitchenware" },
  { label: "Home Decor",  value: "home-decor" },
  { label: "Bath & Body", value: "bath-body" },
  { label: "Lighting",    value: "lighting" },
];

interface ShopClientProps {
  searchParams: Record<string, string>;
}

export function ShopClient({ searchParams }: ShopClientProps) {
  const urlParams = useSearchParams();

  const [products,   setProducts]   = useState<IProduct[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const [category, setCategory] = useState(searchParams.category ?? "");
  const [sort,     setSort]     = useState(searchParams.sort ?? "newest");
  const [minPrice, setMinPrice] = useState(searchParams.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice ?? "");
  const [inStock,  setInStock]  = useState(searchParams.inStock === "true");
  const [search,   setSearch]   = useState(searchParams.search ?? "");
  const [page,     setPage]     = useState(Number(searchParams.page ?? 1));
  const [view,     setView]     = useState<"grid" | "list">("grid");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (sort)     params.set("sort",     sort);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (inStock)  params.set("inStock",  "true");
      if (search)   params.set("search",   search);
      params.set("page",  String(page));
      params.set("limit", "20"); // More products per page for compact grid

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
    <div className="bg-[#fdf8f0] min-h-screen">

      {/* Page header — compact */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-neutral-900">
                {category
                  ? CATEGORIES.find((c) => c.value === category)?.label ?? "Products"
                  : "All Products"}
              </h1>
              {pagination && (
                <p className="text-xs text-neutral-400 mt-0.5">
                  {pagination.total} product{pagination.total !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Free delivery banner */}
            <div className="hidden sm:flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <Tag className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
              <span className="text-xs text-green-700 font-medium">
                Free delivery on orders above ₦100,000
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container-site py-5">

        {/* Category pills — scrollable */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setPage(1); }}
              className={cn(
                "flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
                category === cat.value
                  ? "bg-[#d98c2a] text-white border-[#d98c2a]"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-[#d98c2a] hover:text-[#d98c2a]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {/* Mobile search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search…"
                className="pl-8 pr-3 py-2 text-sm rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#d98c2a] w-36 sm:w-48"
              />
            </div>

            {/* Filter */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all",
                filterOpen || activeFiltersCount > 0
                  ? "bg-[#fdf3e7] border-[#d98c2a] text-[#d98c2a]"
                  : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#d98c2a] text-white text-[9px] flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-neutral-400 hover:text-red-500 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="appearance-none pl-2.5 pr-7 py-2 text-xs rounded-lg border border-neutral-200 bg-white outline-none focus:border-[#d98c2a] cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="hidden sm:flex border border-neutral-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "p-1.5 transition-colors",
                  view === "grid" ? "bg-neutral-900 text-white" : "bg-white text-neutral-400 hover:bg-neutral-50"
                )}
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-1.5 transition-colors",
                  view === "list" ? "bg-neutral-900 text-white" : "bg-white text-neutral-400 hover:bg-neutral-50"
                )}
              >
                <LayoutList className="w-3.5 h-3.5" />
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
              className="overflow-hidden mb-4"
            >
              <div className="bg-white rounded-xl border border-neutral-100 p-4 grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400 block mb-2">
                    Price Range (₦)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-[#d98c2a]"
                    />
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-[#d98c2a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400 block mb-2">
                    Availability
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="w-4 h-4 accent-[#d98c2a]"
                    />
                    <span className="text-sm text-neutral-700">In Stock Only</span>
                  </label>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => { setPage(1); setFilterOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#d98c2a] text-white text-sm font-semibold rounded-lg hover:bg-[#c47020] transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile free delivery */}
        <div className="sm:hidden flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-4">
          <Tag className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <span className="text-xs text-green-700 font-medium">
            Free delivery above ₦100,000
          </span>
        </div>

        {/* Products grid — compact like Jumia: 2 on mobile, 3 tablet, 4 desktop, 5 wide */}
        {loading ? (
          <ProductGridSkeleton count={20} />
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display text-xl text-neutral-400 mb-3">No products found</p>
            <p className="text-sm text-neutral-400 mb-5">Try adjusting your filters or search terms.</p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-lg hover:bg-[#c47020]"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className={cn(
            view === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
              : "grid grid-cols-1 gap-3"
          )}>
            {products.map((product, i) => (
              <ProductCard key={product._id} product={product} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-1.5 mt-10">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={cn(
                  "w-9 h-9 rounded-lg text-sm font-medium transition-all",
                  p === page
                    ? "bg-[#d98c2a] text-white"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:border-[#d98c2a]"
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
