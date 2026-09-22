import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import BlogPost from "@/lib/models/Blog";

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://mercyhomeessentials.com").replace(/\/$/, "");

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: "daily", priority: 1 },
  { url: `${BASE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
  { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE_URL}/faq`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE_URL}/shipping`, changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  { url: `${BASE_URL}/cookies`, changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    await connectDB();
    const [products, categories, posts] = await Promise.all([
      Product.find({ isActive: true }, { slug: 1, updatedAt: 1 }).lean(),
      Category.find({ isActive: true }, { slug: 1, updatedAt: 1 }).lean(),
      BlogPost.find({ isPublished: true }, { slug: 1, updatedAt: 1, publishedAt: 1 }).lean(),
    ]);

    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${BASE_URL}/product/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Category URLs are only included when a dedicated canonical category route exists.
    const activeCategoryCount = categories.length;
    void activeCategoryCount;
    // The current storefront filters categories through /shop, so query-string category
    // URLs are intentionally excluded from the sitemap to avoid duplicate indexable URLs.
    void categories;

    const blogUrls: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${BASE_URL}/blog/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt || p.publishedAt || undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticPages, ...productUrls, ...blogUrls];
  } catch (error) {
    console.error("[sitemap] Failed to build dynamic sitemap", error);
    return staticPages;
  }
}
