import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/lib/models/Settings";

export async function GET(req: NextRequest) {
  // Security check — only runs with secret key
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "mercy-migrate-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const settings = await (Settings as any).getSingleton();

    const updates: any = {};

    if (!settings.brandColors?.primary) {
      updates.brandColors = {
        primary: "#d98c2a", secondary: "#fdf8f0", accent: "#c47020",
        success: "#10b981", warning: "#f59e0b", error: "#ef4444",
      };
    }

    if (!settings.uiColors?.headerBg) {
      updates.uiColors = {
        headerBg: "#fdf8f0", footerBg: "#1a1208", navText: "#404040",
        navTextHover: "#d98c2a", buttonPrimary: "#c47020", buttonText: "#ffffff",
        linkColor: "#d98c2a", cardBg: "#ffffff", pageBg: "#fdf8f0",
        sectionAltBg: "#ffffff", borderColor: "#e5e5e5",
        textPrimary: "#1a1208", textSecondary: "#737373",
      };
    }

    if (!settings.logos?.desktop) {
      updates.logos = {
        desktop: settings.logo ?? "",
        mobile:  settings.logo ?? "",
        footer:  settings.logo ?? "",
        admin:   settings.logo ?? "",
        email:   settings.logo ?? "",
        favicon: settings.favicon ?? "",
      };
    }

    if (!settings.seo?.metaTitle) {
      updates.seo = {
        metaTitle: `${settings.businessName ?? "Mercy Home Essentials"} — Premium Home Goods`,
        metaDescription: "Discover premium home essentials crafted for modern living.",
        ogImage: "", twitterCard: "", keywords: "",
      };
    }

    if (!settings.homepageCMS?.hero) {
      updates.homepageCMS = {
        hero: {
          headline:         settings.homepage?.heroTitle    ?? "Elevate Your Home",
          subheadline:      settings.homepage?.heroSubtitle ?? "Discover premium home essentials.",
          ctaPrimaryText:   settings.homepage?.heroCta      ?? "Shop Collection",
          ctaPrimaryUrl:    settings.homepage?.heroCtaLink  ?? "/shop",
          ctaSecondaryText: "", ctaSecondaryUrl: "",
          image: settings.homepage?.heroImage ?? "",
          bgImage: "", overlay: true, overlayOpacity: 50, textPosition: "left",
        },
        showFeatured: true, showBestSellers: true, showNewArrivals: true,
        showBanners: true, showTestimonials: true, showNewsletter: true,
        showWhyChooseUs: false, showTrustBadges: true,
        aboutTitle: "", aboutText: settings.about ?? "", aboutImage: "",
        testimonials: [],
        trustBadges: [
          { icon: "Truck",       title: "Free Delivery",  text: "On orders over ₦100,000", active: true },
          { icon: "ShieldCheck", title: "Secure Payment", text: "100% protected",          active: true },
          { icon: "Headphones",  title: "24/7 Support",   text: "Always here for you",     active: true },
        ],
        whyChooseUs: [],
        newsletterTitle:   "Join the Mercy Family",
        newsletterSubtext: "Get 10% off your first order.",
      };
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: "Already up to date. Nothing to migrate." });
    }

    Object.assign(settings, updates);
    await settings.save();

    return NextResponse.json({
      success: true,
      message: `Migration complete. Updated: ${Object.keys(updates).join(", ")}`,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
