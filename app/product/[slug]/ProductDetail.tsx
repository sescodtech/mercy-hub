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
import { formatPrice, calculateDiscount, cn } from "@/utils";
import toast from "react-hot-toast";
import type { IProduct, IVariant } from "@/types";

interface ProductDetailProps {
  product: IProduct;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<IVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [zoomed, setZoomed] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product._id);

  const price = selectedVariant?.price ?? product.price;
  const stock = selectedVariant?.stock ?? product.stock;
  const inStock = !product.trackInventory || stock > 0;
  const discount = calculateDiscount(product.price, product.comparePrice);

  // Group variants by name
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
          <nav className="flex items-center gap-2 text-xs text-neutral-400">
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
            {/* Main image */}
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
                      fill
                      priority
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

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNewArrival && <span className="badge-new text-xs px-3 py-1">New Arrival</span>}
                {discount > 0 && <span className="badge-sale text-xs px-3 py-1">{discount}% Off</span>}
              </div>

              <div className="absolute bottom-4 right-4 opacity-50">
                <ZoomIn className="w-5 h-5 text-neutral-600" />
              </div>
            </div>

            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
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
            {/* Category */}
            {typeof product.category === "object" && (
              <Link
                href={`/shop?category=${product.category.slug}`}
                className="text-xs tracking-[0.2em] uppercase text-brand-600 font-medium hover:text-brand-700"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-neutral-900 mt-2 mb-3 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className={cn("w-4 h-4", i <= Math.round(product.rating) ? "text-brand-500 fill-brand-500" : "text-neutral-200 fill-neutral-200")} />
                ))}
              </div>
              <span className="text-sm text-neutral-400">
                {product.rating.toFixed(1)} ({product.reviewCount} review{product.reviewCount !== 1 ? "s" : ""})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display text-3xl font-semibold text-neutral-900">{formatPrice(price)}</span>
              {product.comparePrice && product.comparePrice > price && (
                <>
                  <span className="text-lg text-neutral-400 line-through">{formatPrice(product.comparePrice)}</span>
                  <span className="badge-sale">{discount}% off</span>
                </>
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-neutral-600 leading-relaxed mb-6 text-sm">{product.shortDescription}</p>
            )}

            {/* Variants */}
            {Object.entries(variantGroups).map(([groupName, variants]) => (
              <div key={groupName} className="mb-5">
                <p className="text-sm font-medium text-neutral-700 mb-2">
                  {groupName}:
                  {selectedVariant?.name === groupName && (
                    <span className="ml-2 text-brand-600">{selectedVariant.value}</span>
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
                          ? "border-brand-500 bg-brand-50 text-brand-700 font-medium"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                      )}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-neutral-700">Quantity:</span>
              <div className="flex items-center border border-neutral-200 rounded-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stock || 99, quantity + 1))}
                  className="p-3 text-neutral-500 hover:text-neutral-900 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {product.trackInventory && stock > 0 && stock <= product.lowStockThreshold && (
                <span className="text-xs text-orange-600 font-medium">Only {stock} left!</span>
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
                onClick={() => { toggleItem(product); toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist!"); }}
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
              <button className="w-14 h-14 border border-neutral-200 rounded-sm flex items-center justify-center text-neutral-500 hover:text-neutral-700 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Trust badges */}
            <div className="border-t border-neutral-100 pt-6 space-y-3">
              {[
                { Icon: Truck,       text: "Free delivery on orders over ₦50,000" },
                { Icon: RefreshCw,   text: "30-day hassle-free returns" },
                { Icon: ShieldCheck, text: "Secure payment — Paystack & Flutterwave" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-neutral-600">
                  <Icon className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>

            {/* SKU & Tags */}
            <div className="border-t border-neutral-100 pt-4 mt-4 space-y-1 text-xs text-neutral-400">
              <p>SKU: <span className="font-mono">{product.sku}</span></p>
              {product.tags.length > 0 && (
                <p>Tags: {product.tags.join(", ")}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs: Description / Details / Reviews ── */}
        <div className="mt-16">
          <div className="flex border-b border-neutral-200 gap-8 mb-8">
            {["description", "details", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-4 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                )}
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
                  className="prose prose-neutral max-w-none text-sm leading-relaxed text-neutral-700"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}

              {activeTab === "details" && (
                <div className="max-w-lg">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-neutral-100">
                      {product.attributes.map((attr) => (
                        <tr key={attr.name}>
                          <td className="py-3 text-neutral-500 w-40">{attr.name}</td>
                          <td className="py-3 text-neutral-900 font-medium">{attr.value}</td>
                        </tr>
                      ))}
                      {product.weight && (
                        <tr>
                          <td className="py-3 text-neutral-500">Weight</td>
                          <td className="py-3 font-medium">{product.weight}kg</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "reviews" && (
                <div>
                  {product.reviewCount === 0 ? (
                    <p className="text-neutral-400 text-sm">No reviews yet. Be the first to review this product!</p>
                  ) : (
                    <p className="text-neutral-400 text-sm">Loading reviews…</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
