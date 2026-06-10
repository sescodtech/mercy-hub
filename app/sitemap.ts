import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mercyhomeessentials.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/shop`, priority: 0.9, changeFrequency: "daily" as const },
    { url: `${BASE_URL}/blog`, priority: 0.8, changeFrequency: "weekly" as const },
    { url: `${BASE_URL}/about`, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${BASE_URL}/contact`, priority: 0.7, changeFrequency: "monthly" as const },
    { url: `${BASE_URL}/careers`, priority: 0.6, changeFrequency: "weekly" as const },
    { url: `${BASE_URL}/faq`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${BASE_URL}/returns`, priority: 0.5, changeFrequency: "monthly" as const },
    { url: `${BASE_URL}/privacy`, priority: 0.4, changeFrequency: "yearly" as const },
    { url: `${BASE_URL}/terms`, priority: 0.4, changeFrequency: "yearly" as const },
  ];

  return staticPages.map(({ url, priority, changeFrequency }) => ({
    url,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
