import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },

  // Compress responses
  compress: true,

  // Strict mode for better React error catching
  reactStrictMode: true,

  // Security headers (also defined in vercel.json — both kept for non-Vercel deploys)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",         value: "SAMEORIGIN" },
          { key: "X-XSS-Protection",        value: "1; mode=block" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
        ],
      },
      // Service worker must be served with correct headers
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type",  value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      // Manifest
      {
        source: "/site.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },

  // Redirect legacy sign-in path
  async redirects() {
    return [
      {
        source: "/sign-in",
        destination: "/auth/login",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
