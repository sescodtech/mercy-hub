import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "react-hot-toast";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://mercyhomeessentials.com"),
  title: {
    default: "Mercy Home Essentials — Premium Home Goods",
    template: "%s | Mercy Home Essentials",
  },
  description:
    "Discover premium home essentials crafted for modern living. Bedding, kitchenware, decor, and more — all curated for quality and style.",
  keywords: ["home essentials", "premium bedding", "kitchenware", "home decor", "Nigeria", "luxury home goods"],
  authors: [{ name: "Mercy Home Essentials" }],
  creator: "Mercy Home Essentials",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://mercyhomeessentials.com",
    siteName: "Mercy Home Essentials",
    title: "Mercy Home Essentials — Premium Home Goods",
    description: "Premium home essentials for modern living.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mercy Home Essentials",
    description: "Premium home essentials for modern living.",
    images: ["/og-image.jpg"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export const viewport: Viewport = {
  themeColor: "#d98c2a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-cream antialiased">
        <Providers>
          <Navbar />
          <CartDrawer />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                borderRadius: "4px",
                border: "1px solid #e5e5e5",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
