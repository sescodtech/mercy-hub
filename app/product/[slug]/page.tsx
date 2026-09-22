import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { ProductDetail } from "./ProductDetail";
import type { IProduct } from "@/types";
import { StructuredData } from "@/components/analytics/StructuredData";

// ✅ Next.js 15: params is a Promise
interface PageProps {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params; // ✅ await params
  const product = await getProduct(slug);
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
  const { slug } = await params; // ✅ await params
  const product = await getProduct(slug);
  if (!product) notFound();

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://mercyhomeessentials.com").replace(/\/$/, "");
  const productUrl = `${baseUrl}/product/${encodeURIComponent(product.slug)}`;
  const imageUrls = (product.images || []).map((image) => image.url).filter(Boolean);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description?.slice(0, 500),
    image: imageUrls,
    sku: product.sku,
    url: productUrl,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "NGN",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.rating > 0 && product.reviewCount > 0 ? {
      aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    } : {}),
  };
  return <>
    <StructuredData data={productSchema} />
    <ProductDetail product={product} />
  </>;
}
