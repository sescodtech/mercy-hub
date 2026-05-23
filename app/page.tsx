import { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { CategorySection } from "@/components/home/CategorySection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BannerSection } from "@/components/home/BannerSection";
import { BestSellers } from "@/components/home/BestSellers";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TrustBadges } from "@/components/home/TrustBadges";
import { NewsletterSection } from "@/components/home/NewsletterSection";

export const metadata: Metadata = {
  title: "Mercy Home Essentials — Premium Home Goods",
  description: "Discover premium home essentials crafted for modern living. Bedding, kitchenware, decor, and more.",
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
