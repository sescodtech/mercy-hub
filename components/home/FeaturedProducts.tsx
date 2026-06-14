import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { ProductCard } from "@/components/product/ProductCard";
import type { IProduct } from "@/types";

async function getFeaturedProducts(): Promise<IProduct[]> {
  try {
    await connectDB();
    const products = await Product.find({ isFeatured: true, isActive: true })
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();
  if (products.length === 0) return null;

  return (
    <section className="py-10 bg-white">
      <div className="container-site">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-1" style={{ color: "var(--color-brand-primary, #d98c2a)" }}>
              Handpicked
            </p>
            <h2 className="font-display text-2xl font-semibold text-neutral-900">
              Featured Products
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors"
            style={{} as any}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-brand-primary, #d98c2a)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = ""; }}
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Grid — 2 cols mobile, 3 tablet, 4 desktop, 5 wide */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {products.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} />
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
            style={{ color: "var(--color-brand-primary, #d98c2a)", borderWidth: "1px", borderStyle: "solid", borderColor: "var(--color-brand-primary, #d98c2a)" }}
          >
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
