import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { ProductDetail } from "./ProductDetail";
import type { IProduct } from "@/types";

interface PageProps {
  params: { slug: string };
}

async function getProduct(slug: string): Promise<IProduct | null> {
  try {
    await connectDB();
    const product = await Product.findOne({ slug, isActive: true })
      .populate("category", "name slug")
      .lean();
    return product ? JSON.parse(JSON.stringify(product)) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.seo?.title ?? product.name,
    description: product.seo?.description ?? product.shortDescription ?? product.description?.slice(0, 160),
    keywords: product.seo?.keywords ?? product.tags,
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? "",
      images: product.images?.[0]?.url ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
