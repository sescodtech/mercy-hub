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
    <section className="py-20 bg-white">
      <div className="container-site">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="section-tag">Handpicked</span>
            <h2 className="section-heading">Featured Products</h2>
          </div>
          <Link href="/shop" className="hidden sm:flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-brand-600 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} />
          ))}
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link href="/shop" className="btn-secondary">
            View All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
