"use client";

import { useWishlistStore } from "@/hooks/useWishlist";
import { ProductCard } from "@/components/product/ProductCard";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils";

export default function WishlistClient() {
  const { items, removeItem } = useWishlistStore();

  return (
    <div className="bg-cream min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-8">
          <h1 className="font-display text-3xl font-semibold text-neutral-900 flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            My Wishlist
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Your curated collection of desired items
          </p>
        </div>
      </div>

      <div className="container-site py-8">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-100">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-neutral-300" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-neutral-500 mb-8">Save your favorite products to find them easily later.</p>
            <Link href="/shop" className="btn-primary inline-flex items-center gap-2">
              Go Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-neutral-500">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
              <Link href="/cart" className="text-sm font-medium text-[#d98c2a] hover:underline flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" /> Move all to cart
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
