/**
 * scripts/migrate-settings.js
 *
 * Run once after deploying to add the new fields to the
 * existing Settings document without wiping existing data.
 *
 * Usage:
 *   node scripts/migrate-settings.js
 *
 * Prerequisites:
 *   MONGODB_URI must be set in your environment (or .env.local).
 */

require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");

  await mongoose.connect(uri);
  console.log("✔ Connected to MongoDB");

  const db = mongoose.connection.db;
  const coll = db.collection("settings");

  // Find the single settings document
  const doc = await coll.findOne({});
  if (!doc) {
    console.log("No settings document found. A new one will be created on first app load.");
    await mongoose.disconnect();
    return;
  }

  const updates = {};

  // ── Appearance ──────────────────────────────────────────────
  if (!doc.brandColors) {
    updates.brandColors = {
      primary:   "#d98c2a",
      secondary: "#fdf8f0",
      accent:    "#c47020",
      success:   "#10b981",
      warning:   "#f59e0b",
      error:     "#ef4444",
    };
    console.log("  + brandColors");
  }

  if (!doc.uiColors) {
    updates.uiColors = {
      headerBg:       "#fdf8f0",
      footerBg:       "#1a1208",
      navText:        "#404040",
      navTextHover:   "#d98c2a",
      buttonPrimary:  "#c47020",
      buttonText:     "#ffffff",
      linkColor:      "#d98c2a",
      cardBg:         "#ffffff",
      pageBg:         "#fdf8f0",
      sectionAltBg:   "#ffffff",
      borderColor:    "#e5e5e5",
      textPrimary:    "#1a1208",
      textSecondary:  "#737373",
    };
    console.log("  + uiColors");
  }

  // ── Branding ─────────────────────────────────────────────────
  if (!doc.logos) {
    updates.logos = {
      desktop: doc.logo ?? "",
      mobile:  doc.logo ?? "",
      footer:  doc.logo ?? "",
      admin:   doc.logo ?? "",
      email:   doc.logo ?? "",
      favicon: doc.favicon ?? "",
    };
    console.log("  + logos (seeded from existing logo field)");
  }

  if (!doc.seo) {
    updates.seo = {
      metaTitle:       doc.meta?.title       ?? `${doc.businessName ?? "Mercy Home Essentials"} — Premium Home Goods`,
      metaDescription: doc.meta?.description ?? "Discover premium home essentials crafted for modern living.",
      ogImage:         "",
      twitterCard:     "",
      keywords:        (doc.meta?.keywords ?? []).join(", "),
    };
    console.log("  + seo");
  }

  // ── Homepage CMS ──────────────────────────────────────────────
  if (!doc.homepageCMS) {
    const existingHomepage = doc.homepage ?? {};
    updates.homepageCMS = {
      hero: {
        headline:         existingHomepage.heroTitle    ?? "Elevate Your Home",
        subheadline:      existingHomepage.heroSubtitle ?? "Discover premium home essentials.",
        ctaPrimaryText:   existingHomepage.heroCta      ?? "Shop Collection",
        ctaPrimaryUrl:    existingHomepage.heroCtaLink  ?? "/shop",
        ctaSecondaryText: "",
        ctaSecondaryUrl:  "",
        image:            existingHomepage.heroImage ?? "",
        bgImage:          "",
        overlay:          true,
        overlayOpacity:   50,
        textPosition:     "left",
      },
      showFeatured:    existingHomepage.showFeaturedProducts ?? true,
      showBestSellers: existingHomepage.showBestSellers      ?? true,
      showNewArrivals: true,
      showBanners:     true,
      showTestimonials:existingHomepage.showTestimonials ?? true,
      showNewsletter:  existingHomepage.showNewsletter   ?? true,
      showWhyChooseUs: false,
      showTrustBadges: true,
      aboutTitle:      "",
      aboutText:       doc.about ?? "",
      aboutImage:      "",
      testimonials:    [],
      trustBadges: [
        { icon: "Truck",       title: "Free Delivery",   text: "On orders over ₦50,000", active: true },
        { icon: "ShieldCheck", title: "Secure Payment",  text: "100% protected payments", active: true },
        { icon: "RotateCcw",   title: "Easy Returns",    text: "30-day return policy", active: true },
        { icon: "Headphones",  title: "24/7 Support",    text: "Dedicated support team", active: true },
      ],
      whyChooseUs:       [],
      newsletterTitle:   "Join the Mercy Family",
      newsletterSubtext: "Get 10% off your first order and early access to new arrivals.",
    };
    console.log("  + homepageCMS (seeded from existing homepage field)");
  }

  if (Object.keys(updates).length === 0) {
    console.log("✔ Settings document is already up to date. Nothing to migrate.");
  } else {
    await coll.updateOne({ _id: doc._id }, { $set: updates });
    console.log(`\n✔ Migration complete — updated ${Object.keys(updates).length} field(s):`);
    Object.keys(updates).forEach((k) => console.log(`  • ${k}`));
  }

  await mongoose.disconnect();
  console.log("\n✔ Disconnected from MongoDB");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
