"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { useWishlistStore } from "@/hooks/useWishlist";
import { useCartStore } from "@/hooks/useCart";
import { formatPrice, calculateDiscount } from "@/utils";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);

  const handleMoveToCart = (product: typeof items[0]) => {
    addToCart(product, 1);
    removeItem(product._id);
    toast.success("Moved to cart!");
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-8">
          <h1 className="font-display text-2xl font-semibold text-neutral-900">My Wishlist</h1>
          <p className="text-sm text-neutral-400 mt-1">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="container-site py-8">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
            <p className="font-display text-xl text-neutral-500 mb-2">Your wishlist is empty</p>
            <p className="text-sm text-neutral-400 mb-6">Save items you love to buy them later.</p>
            <Link href="/shop" className="btn-primary">
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <AnimatePresence>
                {items.map((product, i) => {
                  const discount = calculateDiscount(product.price, product.comparePrice);
                  const image    = product.images?.[0]?.url;
                  const inStock  = !product.trackInventory || product.stock > 0;

                  return (
                    <motion.div
                      key={product._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-xl border border-neutral-100 overflow-hidden group"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                        {image ? (
                          <Image
                            src={image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-10 h-10 text-neutral-300" />
                          </div>
                        )}
                        {discount > 0 && (
                          <span className="absolute top-2 left-2 badge-sale">{discount}% off</span>
                        )}
                        <button
                          onClick={() => removeItem(product._id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-white transition-all shadow-sm opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <Link href={`/product/${product.slug}`} className="text-sm font-medium text-neutral-800 hover:text-brand-600 line-clamp-2 block mb-2 leading-snug">
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="price-current text-base">{formatPrice(product.price)}</span>
                          {product.comparePrice && <span className="price-original">{formatPrice(product.comparePrice)}</span>}
                        </div>
                        <button
                          onClick={() => handleMoveToCart(product)}
                          disabled={!inStock}
                          className="w-full btn-primary py-2.5 text-xs justify-center disabled:opacity-50"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {inStock ? "Move to Cart" : "Out of Stock"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => { items.forEach((p) => addToCart(p, 1)); useWishlistStore.getState().clearWishlist(); toast.success("All items moved to cart!"); }}
                className="btn-secondary"
              >
                <ShoppingBag className="w-4 h-4" />
                Move All to Cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
