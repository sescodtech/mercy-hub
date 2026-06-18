"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, X, ChevronDown, Search,
  Grid2X2, LayoutList, Sparkles, Truck, ChevronRight,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/product/ProductSkeleton";
import type { IProduct, IPagination } from "@/types";
import { cn, formatPrice } from "@/utils";
import { useSettings } from "@/hooks/useSettings";

const SORT_OPTIONS = [
  { label: "Newest",      value: "newest" },
  { label: "Price: Low",  value: "price_asc" },
  { label: "Price: High", value: "price_desc" },
  { label: "Best Rated",  value: "rating" },
  { label: "Popular",     value: "popular" },
];

const CATEGORIES = [
  { label: "All",         value: "",            emoji: "✦" },
  { label: "Bedding",     value: "bedding",      emoji: "🛏" },
  { label: "Kitchenware", value: "kitchenware",  emoji: "🍳" },
  { label: "Home Decor",  value: "home-decor",   emoji: "🪴" },
  { label: "Bath & Body", value: "bath-body",    emoji: "🛁" },
  { label: "Lighting",    value: "lighting",     emoji: "💡" },
];

interface ShopClientProps {
  searchParams: Record<string, string>;
}

export function ShopClient({ searchParams }: ShopClientProps) {
  useSearchParams();
  const { settings } = useSettings();
  const freeShippingThreshold = settings?.shipping?.freeShippingThreshold ?? 100000;

  const [products,   setProducts]   = useState<IProduct[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [pagination, setPagination] = useState<IPagination | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const [category, setCategory] = useState(searchParams.category ?? "");
  const [filterTag, setFilterTag] = useState(searchParams.filter   ?? "");
  const [sort,     setSort]     = useState(searchParams.sort     ?? "newest");
  const [minPrice, setMinPrice] = useState(searchParams.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice ?? "");
  const [inStock,  setInStock]  = useState(searchParams.inStock === "true");
  const [search,   setSearch]   = useState(searchParams.search   ?? "");
  const [page,     setPage]     = useState(Number(searchParams.page ?? 1));
  const [view,     setView]     = useState<"grid" | "list">("grid");

  const searchRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category)  params.set("category", category);
      if (filterTag) params.set("filter",   filterTag);
      if (sort)     params.set("sort",     sort);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (inStock)  params.set("inStock",  "true");
      if (search)   params.set("search",   search);
      params.set("page",  String(page));
      params.set("limit", "24");

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
  }, [category, filterTag, sort, minPrice, maxPrice, inStock, search, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const clearFilters = () => {
    setCategory(""); setFilterTag(""); setSort("newest"); setMinPrice("");
    setMaxPrice(""); setInStock(false); setSearch(""); setPage(1);
  };

  const activeFiltersCount = [category, filterTag, minPrice, maxPrice, inStock ? "1" : ""].filter(Boolean).length;
  const FILTER_LABELS: Record<string, string> = { new: "New Arrivals", sale: "On Sale", bestseller: "Best Sellers", featured: "Featured" };
  const activeCategoryLabel = filterTag
    ? (FILTER_LABELS[filterTag] ?? "Filtered")
    : (CATEGORIES.find((c) => c.value === category)?.label ?? "All Products");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-page-bg, #fdf8f0)" }}>

      {/* ── PHASE 4: Professional Hero Header ─────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: "var(--color-footer-bg, #1a1208)" }}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              var(--color-brand-primary, #d98c2a) 0px,
              var(--color-brand-primary, #d98c2a) 1px,
              transparent 1px,
              transparent 12px
            )`,
          }}
        />

        <div className="relative container-site px-4 sm:px-6 py-8 sm:py-10 md:py-12">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs mb-4 sm:mb-5" style={{ color: "var(--color-brand-primary, #d98c2a)" }}>
            <span className="text-white/40">Home</span>
            <ChevronRight className="w-3 h-3 text-white/20" />
            <span className="font-medium">{activeCategoryLabel}</span>
          </div>

          {/* Main header content */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 sm:gap-8">

            {/* Left — title + tagline */}
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: "var(--color-brand-primary, #d98c2a)" }} />
                <span
                  className="text-xs tracking-[0.2em] uppercase font-semibold"
                  style={{ color: "var(--color-brand-primary, #d98c2a)" }}
                >
                  {category || filterTag ? "Curated Collection" : "Premium Store"}
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-tight mb-2">
                {category || filterTag ? activeCategoryLabel : "Home Essentials"}
                {search && (
                  <span className="text-white/50 font-normal">
                    {" "}for <em>"{search}"</em>
                  </span>
                )}
              </h1>

              <p className="text-sm text-white/50 leading-relaxed hidden sm:block">
                {category || filterTag
                  ? `Handpicked ${activeCategoryLabel.toLowerCase()} designed for quality living.`
                  : "Handpicked home goods — from bedding to kitchenware — crafted for quality living."}
              </p>
            </div>

            {/* Right — search bar */}
            <div className="w-full sm:w-auto sm:min-w-[280px] md:min-w-[340px]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search products…"
                  className="w-full pl-10 pr-10 py-3 text-sm rounded-xl text-white placeholder-white/30 outline-none transition-all"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor =
                      "var(--color-brand-primary, #d98c2a)";
                    (e.currentTarget as HTMLInputElement).style.backgroundColor =
                      "rgba(255,255,255,0.12)";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor =
                      "rgba(255,255,255,0.12)";
                    (e.currentTarget as HTMLInputElement).style.backgroundColor =
                      "rgba(255,255,255,0.08)";
                  }}
                />
                {search && (
                  <button
                    onClick={() => { setSearch(""); setPage(1); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Promo strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5" style={{ color: "var(--color-brand-primary, #d98c2a)" }} />
              <span className="text-xs text-white/60">
                Free delivery on orders over{" "}
                <span className="text-white font-semibold">
                  ₦{freeShippingThreshold.toLocaleString()}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-xs text-white/60">
                <span className="text-white font-semibold">100%</span> secure checkout
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-xs text-white/60">
                <span className="text-white font-semibold">24/7</span> customer support
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category pills ──────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 border-b"
        style={{
          backgroundColor: "var(--color-card-bg, #fff)",
          borderColor: "var(--color-border, #e5e5e5)",
        }}
      >
        <div className="container-site px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-2.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {CATEGORIES.map((cat) => {
              const isActive = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setPage(1); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap"
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--color-brand-primary, #d98c2a)",
                          borderColor: "var(--color-brand-primary, #d98c2a)",
                          color: "#fff",
                        }
                      : {
                          backgroundColor: "transparent",
                          borderColor: "var(--color-border, #e5e5e5)",
                          color: "var(--color-text-secondary, #737373)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-brand-primary, #d98c2a)";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "var(--color-brand-primary, #d98c2a)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor =
                        "var(--color-border, #e5e5e5)";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "var(--color-text-secondary, #737373)";
                    }
                  }}
                >
                  <span className="hidden sm:inline">{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="container-site px-4 sm:px-6 pt-4 pb-2">
        <div className="flex items-center justify-between gap-3">

          {/* Left — filter + clear */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
              style={
                filterOpen || activeFiltersCount > 0
                  ? {
                      backgroundColor: "color-mix(in srgb, var(--color-brand-primary, #d98c2a) 10%, transparent)",
                      borderColor: "var(--color-brand-primary, #d98c2a)",
                      color: "var(--color-brand-primary, #d98c2a)",
                    }
                  : {
                      backgroundColor: "var(--color-card-bg, #fff)",
                      borderColor: "var(--color-border, #e5e5e5)",
                      color: "var(--color-text-secondary, #737373)",
                    }
              }
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span
                  className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: "var(--color-brand-primary, #d98c2a)" }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-neutral-400 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          {/* Right — sort + view */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="appearance-none pl-2.5 pr-7 py-2 text-xs rounded-lg border bg-white outline-none cursor-pointer transition-colors"
                style={{
                  borderColor: "var(--color-border, #e5e5e5)",
                  color: "var(--color-text-primary, #1a1208)",
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLSelectElement).style.borderColor =
                    "var(--color-brand-primary, #d98c2a)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLSelectElement).style.borderColor =
                    "var(--color-border, #e5e5e5)";
                }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            </div>

            {/* View toggle — desktop only */}
            <div className="hidden sm:flex border border-neutral-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={cn(
                  "p-1.5 transition-colors",
                  view === "grid" ? "bg-neutral-900 text-white" : "bg-white text-neutral-400 hover:bg-neutral-50"
                )}
                aria-label="Grid view"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "p-1.5 transition-colors",
                  view === "list" ? "bg-neutral-900 text-white" : "bg-white text-neutral-400 hover:bg-neutral-50"
                )}
                aria-label="List view"
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
              className="overflow-hidden"
            >
              <div
                className="mt-3 rounded-xl border p-4 grid sm:grid-cols-3 gap-4"
                style={{
                  backgroundColor: "var(--color-card-bg, #fff)",
                  borderColor: "var(--color-border, #e5e5e5)",
                }}
              >
                <div>
                  <label
                    className="text-xs font-semibold uppercase tracking-wide block mb-2"
                    style={{ color: "var(--color-text-secondary, #737373)" }}
                  >
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
                  <label
                    className="text-xs font-semibold uppercase tracking-wide block mb-2"
                    style={{ color: "var(--color-text-secondary, #737373)" }}
                  >
                    Availability
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={(e) => setInStock(e.target.checked)}
                      className="w-4 h-4 accent-[#d98c2a]"
                    />
                    <span className="text-sm" style={{ color: "var(--color-text-primary, #1a1208)" }}>
                      In Stock Only
                    </span>
                  </label>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => { setPage(1); setFilterOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors"
                    style={{ backgroundColor: "var(--color-brand-primary, #d98c2a)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "var(--color-brand-accent, #c47020)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        "var(--color-brand-primary, #d98c2a)";
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Product grid ─────────────────────────────────────────────── */}
      <div className="container-site px-4 sm:px-6 pb-12 pt-3">
        {loading ? (
          <ProductGridSkeleton count={24} />
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-brand-primary, #d98c2a) 10%, transparent)",
              }}
            >
              <Search className="w-7 h-7" style={{ color: "var(--color-brand-primary, #d98c2a)" }} />
            </div>
            <p className="font-display text-xl font-semibold text-neutral-700 mb-2">No products found</p>
            <p className="text-sm text-neutral-400 mb-6">Try adjusting your filters or search terms.</p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-colors"
              style={{ backgroundColor: "var(--color-brand-primary, #d98c2a)" }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div
            className={cn(
              view === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4"
                : "grid grid-cols-1 gap-3"
            )}
          >
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
                className="w-9 h-9 rounded-lg text-sm font-medium transition-all border"
                style={
                  p === page
                    ? {
                        backgroundColor: "var(--color-brand-primary, #d98c2a)",
                        borderColor: "var(--color-brand-primary, #d98c2a)",
                        color: "#fff",
                      }
                    : {
                        backgroundColor: "var(--color-card-bg, #fff)",
                        borderColor: "var(--color-border, #e5e5e5)",
                        color: "var(--color-text-secondary, #737373)",
                      }
                }
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
