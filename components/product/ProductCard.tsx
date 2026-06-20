"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Star, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/hooks/useCart";
import { useWishlistStore } from "@/hooks/useWishlist";
import { formatPrice, calculateDiscount, cn } from "@/utils";
import toast from "react-hot-toast";
import type { IProduct } from "@/types";

interface ProductCardProps {
  product: IProduct;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const [imgIdx,  setImgIdx]  = useState(0);
  const [hovered, setHovered] = useState(false);
  const [adding,  setAdding]  = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product._id);

  const discount       = calculateDiscount(product.price, product.comparePrice);
  const primaryImage   = product.images?.[imgIdx]?.url;
  const secondaryImage = product.images?.[1]?.url;
  const inStock        = !product.trackInventory || product.stock > 0;
  const isLowStock     = product.trackInventory && product.stock > 0 && product.stock <= product.lowStockThreshold;
  const isOnSale       = discount > 0 && product.comparePrice;
  const hasRating      = product.reviewCount > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock || adding) return;
    setAdding(true);
    addItem(product, 1);
    toast.success("Added to cart!", { icon: "🛍️" });
    setTimeout(() => setAdding(false), 600);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product);
    toast.success(wishlisted ? "Removed from wishlist" : "Saved!", {
      icon: wishlisted ? "💔" : "❤️",
    });
  };

  return (
    <div
      className="group relative bg-white rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
      style={{ border: "1px solid var(--color-border, #e5e5e5)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="block">

        {/* ── Image container ── */}
        <div className="relative overflow-hidden bg-neutral-50" style={{ aspectRatio: "4 / 5" }}>

          {/* Top-left badges */}
          <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
            {discount > 0 && (
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-500 text-white leading-tight tracking-wide">
                -{discount}%
              </span>
            )}
            {product.isNewArrival && !discount && (
              <span
                className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm text-white leading-tight tracking-wide"
                style={{ backgroundColor: "var(--color-brand-primary, #d98c2a)" }}
              >
                NEW
              </span>
            )}
            {!inStock && (
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-neutral-400 text-white leading-tight">
                SOLD OUT
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={cn(
              "absolute top-1.5 right-1.5 z-10 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm",
              wishlisted
                ? "opacity-100 text-white"
                : "bg-white text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-red-500"
            )}
            style={wishlisted ? { backgroundColor: "var(--color-brand-error, #ef4444)" } : undefined}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", wishlisted && "fill-current")} />
          </button>

          {/* Product image */}
          {primaryImage ? (
            <Image
              src={hovered && secondaryImage ? secondaryImage : primaryImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-neutral-200" />
            </div>
          )}

          {/* Image switcher dots */}
          {product.images?.length > 1 && hovered && (
            <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 z-10">
              {product.images.slice(0, 4).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setImgIdx(i); }}
                  className={cn(
                    "h-1 rounded-full transition-all duration-200",
                    i === imgIdx ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Quick-add button — slides up on hover, desktop only */}
          {inStock && (
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 transition-transform duration-200 hidden sm:block",
                hovered ? "translate-y-0" : "translate-y-full"
              )}
            >
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold tracking-wider uppercase text-white transition-colors"
                style={{ backgroundColor: "var(--color-footer-bg, #1a1208)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-button-primary, #c47020)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--color-footer-bg, #1a1208)";
                }}
              >
                <ShoppingCart className="w-3 h-3" />
                {adding ? "Added!" : "Quick Add"}
              </button>
            </div>
          )}
        </div>

        {/* ── Product info ── */}
        <div className="p-1.5 sm:p-2">

          {/* Category label */}
          {typeof product.category === "object" && product.category?.name && (
            <p
              className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mb-0.5 truncate"
              style={{ color: "var(--color-text-secondary, #737373)" }}
            >
              {product.category.name}
            </p>
          )}

          {/* Product name — 2-line clamp, smaller on mobile */}
          <h3
            className="text-[10px] sm:text-xs font-medium line-clamp-2 leading-snug mb-1 transition-colors duration-150"
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--color-text-primary, #1a1208)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLHeadingElement).style.color =
                "var(--color-brand-primary, #d98c2a)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLHeadingElement).style.color =
                "var(--color-text-primary, #1a1208)";
            }}
          >
            {product.name}
          </h3>

          {/* Rating — compact */}
          {hasRating && (
            <div className="flex items-center gap-1 mb-1.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5")}
                    style={
                      i <= Math.round(product.rating)
                        ? { color: "var(--color-brand-primary, #d98c2a)", fill: "currentColor" }
                        : { color: "#e5e5e5", fill: "currentColor" }
                    }
                  />
                ))}
              </div>
              <span className="text-[9px] sm:text-[10px] text-neutral-400">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[11px] sm:text-sm font-bold leading-none"
                style={{
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.02em",
                  color: isOnSale
                    ? "var(--color-brand-accent, #c47020)"
                    : "var(--color-text-primary, #1a1208)",
                }}
              >
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span
                  className="text-[10px] sm:text-xs text-neutral-400 line-through leading-none"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>

            {/* Mobile add to cart — small icon button, always visible */}
            {inStock && (
              <button
                onClick={handleAddToCart}
                className="sm:hidden w-6 h-6 rounded-md flex items-center justify-center text-white flex-shrink-0 transition-opacity"
                style={{ backgroundColor: "var(--color-brand-primary, #d98c2a)" }}
                aria-label="Add to cart"
              >
                <ShoppingCart className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Low stock label */}
          {isLowStock && (
            <p className="text-[9px] sm:text-[10px] text-orange-500 font-medium mt-1 leading-tight">
              Only {product.stock} left
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
