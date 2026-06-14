"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
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
  const [imgIdx,    setImgIdx]    = useState(0);
  const [hovered,   setHovered]   = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product._id);

  const discount       = calculateDiscount(product.price, product.comparePrice);
  const primaryImage   = product.images?.[imgIdx]?.url;
  const secondaryImage = product.images?.[1]?.url;
  const inStock        = !product.trackInventory || product.stock > 0;
  const isLowStock     = product.trackInventory && product.stock > 0 && product.stock <= product.lowStockThreshold;
  const isOnSale       = discount > 0 && product.comparePrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!inStock) return;
    addItem(product, 1);
    toast.success("Added to cart!", { icon: "🛍️" });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product);
    toast.success(wishlisted ? "Removed from wishlist" : "Saved!", { icon: wishlisted ? "💔" : "❤️" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/product/${product.slug}`} className="block">

        {/* ── Image ── */}
        <div className="relative overflow-hidden bg-neutral-100 rounded-lg aspect-square mb-2.5">

          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
            {discount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white leading-tight">
                -{discount}%
              </span>
            )}
            {product.isNewArrival && !discount && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#d98c2a] text-white leading-tight">
                NEW
              </span>
            )}
            {!inStock && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-400 text-white leading-tight">
                SOLD OUT
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={cn(
              "absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm",
              wishlisted
                ? "bg-red-500 text-white opacity-100"
                : "bg-white text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
            )}
            aria-label="Wishlist"
          >
            <Heart className={cn("w-3.5 h-3.5", wishlisted && "fill-current")} />
          </button>

          {/* Product image */}
          {primaryImage ? (
            <Image
              src={hovered && secondaryImage ? secondaryImage : primaryImage}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-neutral-300" />
            </div>
          )}

          {/* Image switcher dots */}
          {product.images?.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {product.images.slice(0, 4).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setImgIdx(i); }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === imgIdx ? "bg-white w-3" : "bg-white/60"
                  )}
                />
              ))}
            </div>
          )}

          {/* Add to cart — slides up on hover */}
          {inStock && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: hovered ? 0 : "100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute bottom-0 left-0 right-0"
            >
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold tracking-wider uppercase text-white bg-[#1a1208]/90 backdrop-blur-sm hover:bg-[#1a1208] transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Add to Cart
              </button>
            </motion.div>
          )}
        </div>

        {/* ── Product info ── */}
        <div className="px-0.5">

          {/* Category */}
          {typeof product.category === "object" && product.category?.name && (
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5 truncate">
              {product.category.name}
            </p>
          )}

          {/* Name */}
          <h3 className="text-sm font-medium text-neutral-800 line-clamp-2 leading-snug group-hover:text-[#d98c2a] transition-colors mb-1.5"
            style={{ fontFamily: "var(--font-body)" }}>
            {product.name}
          </h3>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5",
                      i <= Math.round(product.rating)
                        ? "text-[#d98c2a] fill-[#d98c2a]"
                        : "text-neutral-200 fill-neutral-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] text-neutral-400">({product.reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn("text-sm font-bold leading-none", isOnSale ? "text-[#c47020]" : "text-neutral-900")}
              style={{ fontFamily: "var(--font-body)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}
            >
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span
                className="text-xs text-neutral-400 line-through leading-none"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatPrice(product.comparePrice)}
              </span>
            )}
            {isLowStock && (
              <span className="text-[10px] text-orange-500 font-medium">Low stock</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
