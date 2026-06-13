import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import Settings from "@/lib/models/Settings";
import { Product } from "@/lib/models";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TrustBadges } from "@/components/home/TrustBadges";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { AboutSection } from "@/components/home/AboutSection";
import { BannerSection } from "@/components/home/BannerSection";
import { Banner } from "@/lib/models";

export const revalidate = 300; // ISR — refresh every 5 min

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const s = await (Settings as any).getSingleton();
  return {
    title:       s.seo?.metaTitle || `${s.businessName} — Premium Home Goods`,
    description: s.seo?.metaDescription || "Discover premium home essentials crafted for modern Nigerian living.",
    openGraph: s.seo?.ogImage ? { images: [s.seo.ogImage] } : undefined,
  };
}

async function getPageData() {
  await connectDB();

  const [settings, featuredProducts, bestSellers, newArrivals, banners] =
    await Promise.all([
      (Settings as any).getSingleton(),
      Product.find({ isActive: true, isFeatured: true }).limit(8).lean(),
      Product.find({ isActive: true, isBestSeller: true }).limit(8).lean(),
      Product.find({ isActive: true, isNewArrival: true }).sort({ createdAt: -1 }).limit(8).lean(),
      Banner.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    ]);

  return { settings, featuredProducts, bestSellers, newArrivals, banners };
}

export default async function HomePage() {
  const { settings, featuredProducts, bestSellers, newArrivals, banners } = await getPageData();
  const cms  = settings?.homepageCMS ?? {};
  const hero = cms.hero ?? settings?.homepage ?? {};

  return (
    <div>
      {/* ── Hero ── */}
      <HeroSection hero={{
        headline:         hero.headline      ?? hero.heroTitle,
        subheadline:      hero.subheadline   ?? hero.heroSubtitle,
        ctaPrimaryText:   hero.ctaPrimaryText  ?? hero.heroCta,
        ctaPrimaryUrl:    hero.ctaPrimaryUrl   ?? hero.heroCtaLink ?? "/shop",
        ctaSecondaryText: hero.ctaSecondaryText,
        ctaSecondaryUrl:  hero.ctaSecondaryUrl,
        image:            hero.image         ?? hero.heroImage,
        bgImage:          hero.bgImage,
        overlay:          hero.overlay,
        overlayOpacity:   hero.overlayOpacity,
        textPosition:     hero.textPosition,
      }} />

      {/* ── Trust badges ── */}
      {(cms.showTrustBadges ?? true) && (
        <TrustBadges badges={cms.trustBadges ?? []} />
      )}

      {/* ── Featured products ── */}
      {(cms.showFeatured ?? true) && featuredProducts.length > 0 && (
        <FeaturedProducts
          title="Featured Products"
          subtitle="Editor's Picks"
          products={featuredProducts as any}
        />
      )}

      {/* ── Banners ── */}
      {(cms.showBanners ?? true) && banners.length > 0 && (
        <BannerSection banners={banners as any} />
      )}

      {/* ── Best sellers ── */}
      {(cms.showBestSellers ?? true) && bestSellers.length > 0 && (
        <FeaturedProducts
          title="Best Sellers"
          subtitle="Most Loved"
          products={bestSellers as any}
          bgAlt
        />
      )}

      {/* ── New arrivals ── */}
      {(cms.showNewArrivals ?? true) && newArrivals.length > 0 && (
        <FeaturedProducts
          title="New Arrivals"
          subtitle="Just Landed"
          products={newArrivals as any}
        />
      )}

      {/* ── About section ── */}
      {(cms.aboutTitle || cms.aboutText) && (
        <AboutSection
          title={cms.aboutTitle}
          text={cms.aboutText}
          image={cms.aboutImage}
        />
      )}

      {/* ── Testimonials ── */}
      {(cms.showTestimonials ?? true) && (cms.testimonials?.length ?? 0) > 0 && (
        <TestimonialsSection testimonials={cms.testimonials ?? []} />
      )}

      {/* ── Newsletter ── */}
      {(cms.showNewsletter ?? true) && (
        <NewsletterSection
          title={cms.newsletterTitle}
          subtitle={cms.newsletterSubtext}
        />
      )}
    </div>
  );
}
