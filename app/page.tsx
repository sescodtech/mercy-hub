import { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { CategorySection } from "@/components/home/CategorySection";
import { DigitalServicesSection } from "@/components/home/DigitalServicesSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BannerSection, BestSellers, TestimonialsSection } from "@/components/home/BannerSection";
import { TrustBadges } from "@/components/home/TrustBadges";

export const metadata: Metadata = {
  title: "Mercy Home Essentials — Premium Home Goods",
  description: "Discover premium home essentials crafted for modern living. Bedding, kitchenware, decor, and more — quality you can trust.",
  openGraph: {
    title: "Mercy Home Essentials — Premium Home Goods",
    description: "Discover premium home essentials crafted for modern living.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBadges />
      <DigitalServicesSection />
      <CategorySection />
      <FeaturedProducts />
      <BannerSection />
      <BestSellers />
      <TestimonialsSection />
      {/* NewsletterSection removed here — it already exists in Footer to avoid duplication */}
    </>
  );
}
