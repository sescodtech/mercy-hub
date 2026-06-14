"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ShoppingBag, Star, ChevronRight, Minus, Plus,
  Share2, ShieldCheck, Truck, RefreshCw, ZoomIn,
} from "lucide-react";
import { useCartStore } from "@/hooks/useCart";
import { useWishlistStore } from "@/hooks/useWishlist";
import { useSettings } from "@/hooks/useSettings";
import { ReviewSection } from "@/components/product/ReviewSection";
import { formatPrice, calculateDiscount, cn } from "@/utils";
import toast from "react-hot-toast";
import type { IProduct, IVariant } from "@/types";

interface ProductDetailProps {
  product: IProduct;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage,   setSelectedImage]   = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<IVariant | null>(null);
  const [quantity,        setQuantity]        = useState(1);
  const [activeTab,       setActiveTab]       = useState("description");
  const [zoomed,          setZoomed]          = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();
  const { settings } = useSettings();
  const wishlisted = isWishlisted(product._id);

  const price    = selectedVariant?.price ?? product.price;
  const stock    = selectedVariant?.stock ?? product.stock;
  const inStock  = !product.trackInventory || stock > 0;
  const discount = calculateDiscount(product.price, product.comparePrice);
  const isOnSale = discount > 0 && product.comparePrice;

  const variantGroups = product.variants.reduce<Record<string, IVariant[]>>((acc, v) => {
    acc[v.name] = acc[v.name] ?? [];
    acc[v.name].push(v);
    return acc;
  }, {});

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem(product, quantity, selectedVariant ?? undefined);
    toast.success(`${product.name} added to cart!`, { icon: "🛍️" });
  };

  return (
    <div className="bg-cream min-h-screen">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-3">
          <nav className="flex items-center gap-2 text-xs text-neutral-400" style={{ fontFamily: "var(--font-body)" }}>
            <Link href="/" className="hover:text-brand-600">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/shop" className="hover:text-brand-600">Shop</Link>
            {typeof product.category === "object" && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/shop?category=${product.category.slug}`} className="hover:text-brand-600">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-neutral-600 truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container-site py-10">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">

          {/* ── Gallery ── */}
          <div className="space-y-4">
            <div
              className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 cursor-zoom-in"
              onClick={() => setZoomed(!zoomed)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  {product.images?.[selectedImage]?.url ? (
                    <Image
                      src={product.images[selectedImage].url}
                      alt={`${product.name} - image ${selectedImage + 1}`}
                      fill priority
                      className={cn("object-cover transition-transform duration-500", zoomed && "scale-150")}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-neutral-300" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNewArrival && <span className="badge-new">New Arrival</span>}
                {discount > 0 && <span className="badge-sale">{discount}% Off</span>}
              </div>

              <div className="absolute bottom-4 right-4 opacity-40">
                <ZoomIn className="w-5 h-5 text-neutral-600" />
              </div>
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                      selectedImage === i
                        ? "border-brand-500 shadow-brand-sm"
                        : "border-transparent hover:border-neutral-300"
                    )}
                  >
                    <Image src={img.url} alt={`Thumbnail ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div className="lg:py-4">

            {/* Category label */}
            {typeof product.category === "object" && (
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="product-category-label hover:text-brand-600 transition-colors block mb-3"
              >
                {product.category.name}
              </Link>
            )}

            {/* ── Product name — Inter, bold, highly readable ── */}
            <h1
              className="mb-4 leading-tight"
              style={{
                fontFamily:    "var(--font-body)",
                fontSize:      "clamp(1.5rem, 3vw, 2rem)",
                fontWeight:    "700",
                letterSpacing: "-0.025em",
                color:         "#111111",
                lineHeight:    "1.2",
              }}
            >
              {product.name}
            </h1>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i <= Math.round(product.rating)
                          ? "text-brand-500 fill-brand-500"
                          : "text-neutral-200 fill-neutral-200"
                      )}
                    />
                  ))}
                </div>
                <span
                  className="text-sm text-neutral-400"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {product.rating.toFixed(1)} ({product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""})
                </span>
              </div>
            )}

            {/* ── Price — Inter, bold, tabular nums ── */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className={isOnSale ? "price-sale" : "price-current-lg"}>
                {formatPrice(price)}
              </span>
              {product.comparePrice && product.comparePrice > price && (
                <>
                  <span className="price-original" style={{ fontSize: "1.0625rem" }}>
                    {formatPrice(product.comparePrice)}
                  </span>
                  <span className="badge-sale">{discount}% off</span>
                </>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p
                className="mb-6 leading-relaxed"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize:   "0.9375rem",
                  color:      "#525252",
                }}
              >
                {product.shortDescription}
              </p>
            )}

            {/* Variants */}
            {Object.entries(variantGroups).map(([groupName, variants]) => (
              <div key={groupName} className="mb-5">
                <p
                  className="mb-2"
                  style={{
                    fontFamily:    "var(--font-body)",
                    fontSize:      "0.8125rem",
                    fontWeight:    "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color:         "#404040",
                  }}
                >
                  {groupName}
                  {selectedVariant?.name === groupName && (
                    <span className="ml-2 normal-case text-brand-600" style={{ fontWeight: "500", letterSpacing: "normal" }}>
                      — {selectedVariant.value}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v._id}
                      onClick={() => setSelectedVariant(v)}
                      className={cn(
                        "px-4 py-2 rounded-sm border text-sm transition-all",
                        selectedVariant?._id === v._id
                          ? "border-brand-500 bg-brand-50 text-brand-700 font-semibold"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                      )}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span
                style={{
                  fontFamily:    "var(--font-body)",
                  fontSize:      "0.8125rem",
                  fontWeight:    "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color:         "#404040",
                }}
              >
                Quantity
              </span>
              <div className="flex items-center border border-neutral-200 rounded-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  className="w-12 text-center"
                  style={{ fontFamily: "var(--font-body)", fontWeight: "600", fontSize: "0.9375rem" }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stock || 99, quantity + 1))}
                  className="p-3 text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {product.trackInventory && stock > 0 && stock <= product.lowStockThreshold && (
                <span
                  className="text-orange-600"
                  style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem", fontWeight: "600" }}
                >
                  Only {stock} left!
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={cn(
                  "btn-primary flex-1 py-4 text-base justify-center",
                  !inStock && "opacity-50 cursor-not-allowed"
                )}
              >
                <ShoppingBag className="w-5 h-5" />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </button>
              <button
                onClick={() => {
                  toggleItem(product);
                  toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist!");
                }}
                className={cn(
                  "w-14 h-14 border rounded-sm flex items-center justify-center transition-all flex-shrink-0",
                  wishlisted
                    ? "bg-red-50 border-red-300 text-red-500"
                    : "border-neutral-200 text-neutral-600 hover:border-red-300 hover:text-red-500"
                )}
                aria-label="Wishlist"
              >
                <Heart className={cn("w-5 h-5", wishlisted && "fill-current")} />
              </button>
              <button
                className="w-14 h-14 border border-neutral-200 rounded-sm flex items-center justify-center text-neutral-500 hover:text-neutral-700 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Trust badges */}
            <div className="border-t border-neutral-100 pt-6 space-y-3">
              {[
                {
                  Icon: Truck,
                  text: settings?.shipping?.freeShippingEnabled
                    ? `Free delivery on orders over ₦${(settings?.shipping?.freeShippingThreshold ?? 100000).toLocaleString()}`
                    : "Shipping calculated at checkout",
                },
                { Icon: RefreshCw,   text: "30-day hassle-free returns" },
                { Icon: ShieldCheck, text: "Secure payment — Paystack & Flutterwave" },
              ].map(({ Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-3"
                  style={{ fontFamily: "var(--font-body)", fontSize: "0.875rem", color: "#525252" }}
                >
                  <Icon className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>

            {/* SKU */}
            <div className="border-t border-neutral-100 pt-4 mt-4 space-y-1">
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize:   "0.75rem",
                  color:      "#a3a3a3",
                }}
              >
                SKU: <span className="font-mono">{product.sku}</span>
              </p>
              {product.tags.length > 0 && (
                <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#a3a3a3" }}>
                  Tags: {product.tags.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-16">
          <div className="flex border-b border-neutral-200 gap-8 mb-8">
            {["description", "details", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-4 capitalize transition-colors border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                )}
                style={{
                  fontFamily:    "var(--font-body)",
                  fontSize:      "0.875rem",
                  fontWeight:    activeTab === tab ? "600" : "500",
                  letterSpacing: "0.01em",
                }}
              >
                {tab} {tab === "reviews" && `(${product.reviewCount})`}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "description" && (
                <div
                  className="prose prose-neutral max-w-none leading-relaxed"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize:   "0.9375rem",
                    color:      "#404040",
                  }}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}

              {activeTab === "details" && (
                <div className="max-w-lg">
                  <table className="w-full" style={{ fontFamily: "var(--font-body)" }}>
                    <tbody className="divide-y divide-neutral-100">
                      {product.attributes.map((attr) => (
                        <tr key={attr.name}>
                          <td className="py-3 text-neutral-400 w-40 text-sm">{attr.name}</td>
                          <td className="py-3 text-neutral-900 text-sm font-semibold">{attr.value}</td>
                        </tr>
                      ))}
                      {product.weight && (
                        <tr>
                          <td className="py-3 text-neutral-400 text-sm">Weight</td>
                          <td className="py-3 text-neutral-900 text-sm font-semibold">{product.weight}kg</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-3 text-neutral-400 text-sm">SKU</td>
                        <td className="py-3 text-sm font-mono text-neutral-700">{product.sku}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "reviews" && <ReviewSection productId={product._id} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
