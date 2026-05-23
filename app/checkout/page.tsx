import { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BannerSection, BestSellers, TestimonialsSection, NewsletterSection } from "@/components/home/BannerSection";
import { TrustBadges } from "@/components/home/TrustBadges";

export const metadata: Metadata = {
  title: "Mercy Home Essentials — Premium Home Goods",
  description: "Discover premium home essentials crafted for modern living.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBadges />
      <CategorySection />
      <FeaturedProducts />
      <BannerSection />
      <BestSellers />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
