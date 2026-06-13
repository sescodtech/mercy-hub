"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
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
  const [imgIdx,     setImgIdx]     = useState(0);
  const [isHovered,  setIsHovered]  = useState(false);

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
    toast.success("Added to cart!", {
      icon: "🛍️",
      style: { fontFamily: "var(--font-body)" },
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product);
    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist!", {
      icon: wishlisted ? "💔" : "❤️",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Link
        href={`/product/${product.slug}`}
        className="group block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image container */}
        <div className="relative overflow-hidden rounded-lg bg-neutral-100 aspect-[4/5] mb-3">
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            {product.isNewArrival && <span className="badge-new">New</span>}
            {discount > 0   && <span className="badge-sale">-{discount}%</span>}
            {product.isBestSeller && <span className="badge-trending">Best Seller</span>}
            {!inStock        && <span className="badge-oos">Out of Stock</span>}
            {isLowStock      && <span className="badge-sale">Only {product.stock} left</span>}
          </div>

          {/* Action buttons */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
              transition={{ duration: 0.2 }}
              onClick={handleWishlist}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors",
                wishlisted
                  ? "bg-red-500 text-white"
                  : "bg-white text-neutral-600 hover:bg-red-50 hover:text-red-500"
              )}
              aria-label="Wishlist"
            >
              <Heart className={cn("w-4 h-4", wishlisted && "fill-current")} />
            </motion.button>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 10 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <Link
                href={`/product/${product.slug}`}
                className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md text-neutral-600 hover:bg-neutral-50"
                aria-label="Quick view"
              >
                <Eye className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Image */}
          <div className="relative w-full h-full">
            {primaryImage ? (
              <Image
                src={isHovered && secondaryImage ? secondaryImage : primaryImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-neutral-300" />
              </div>
            )}
          </div>

          {/* Image dots */}
          {product.images?.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {product.images.slice(0, 4).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setImgIdx(i); }}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === imgIdx ? "bg-white scale-125" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Add to cart bar */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: isHovered && inStock ? 0 : "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0 bg-ebony/95 backdrop-blur-sm"
          >
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-cream text-sm font-semibold tracking-wide hover:bg-brand-700 transition-colors"
              style={{ fontFamily: "var(--font-body)", letterSpacing: "0.04em" }}
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Cart
            </button>
          </motion.div>
        </div>

        {/* ── Product info ── */}
        <div className="px-0.5 space-y-1.5">

          {/* Category label */}
          <p className="product-category-label">
            {typeof product.category === "object" ? product.category?.name : ""}
          </p>

          {/* Product name */}
          <h3 className={cn(
            "product-name line-clamp-2 group-hover:text-brand-600 transition-colors",
          )}>
            {product.name}
          </h3>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i <= Math.round(product.rating)
                        ? "text-brand-500 fill-brand-500"
                        : "text-neutral-200 fill-neutral-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-neutral-400" style={{ fontFamily: "var(--font-body)" }}>
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price row */}
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className={isOnSale ? "price-sale" : "price-current"}>
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="price-original">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
