import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Color Variant Sub-schema ────────────────────────────────
// Used inside Product model for per-color images, stock, SKU, pricing
export const ColorVariantSchema = new Schema(
  {
    label:         { type: String, required: true, trim: true },  // "Midnight Black"
    colorHex:      { type: String, required: true },              // "#1a1a1a"
    images:        [{ type: String }],                            // Cloudinary URLs
    sku:           { type: String, trim: true },
    priceOverride: { type: Number, default: null },               // null = use base price
    stock:         { type: Number, default: 0, min: 0 },
    enabled:       { type: Boolean, default: true },
    sortOrder:     { type: Number, default: 0 },
  },
  { _id: true }
);

// ─── Appearance sub-schemas ──────────────────────────────────
const BrandColorsSchema = new Schema({
  primary:   { type: String, default: "#d98c2a" },
  secondary: { type: String, default: "#fdf8f0" },
  accent:    { type: String, default: "#c47020" },
  success:   { type: String, default: "#10b981" },
  warning:   { type: String, default: "#f59e0b" },
  error:     { type: String, default: "#ef4444" },
}, { _id: false });

const UIColorsSchema = new Schema({
  headerBg:       { type: String, default: "#fdf8f0" },
  footerBg:       { type: String, default: "#1a1208" },
  navText:        { type: String, default: "#404040" },
  navTextHover:   { type: String, default: "#d98c2a" },
  buttonPrimary:  { type: String, default: "#c47020" },
  buttonText:     { type: String, default: "#ffffff" },
  linkColor:      { type: String, default: "#d98c2a" },
  cardBg:         { type: String, default: "#ffffff" },
  pageBg:         { type: String, default: "#fdf8f0" },
  sectionAltBg:   { type: String, default: "#ffffff" },
  borderColor:    { type: String, default: "#e5e5e5" },
  textPrimary:    { type: String, default: "#1a1208" },
  textSecondary:  { type: String, default: "#737373" },
}, { _id: false });

// ─── Branding sub-schemas ────────────────────────────────────
const LogosSchema = new Schema({
  desktop: { type: String, default: "" },  // Cloudinary URL
  mobile:  { type: String, default: "" },
  footer:  { type: String, default: "" },
  admin:   { type: String, default: "" },
  email:   { type: String, default: "" },
  favicon: { type: String, default: "" },
}, { _id: false });

const SEOSchema = new Schema({
  metaTitle:       { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  ogImage:         { type: String, default: "" },
  twitterCard:     { type: String, default: "" },
  keywords:        { type: String, default: "" },
}, { _id: false });

// ─── Homepage CMS sub-schemas ────────────────────────────────
const HeroSchema = new Schema({
  headline:       { type: String, default: "Elevate Your Home" },
  subheadline:    { type: String, default: "Discover premium home essentials crafted for modern Nigerian living." },
  ctaPrimaryText: { type: String, default: "Shop Collection" },
  ctaPrimaryUrl:  { type: String, default: "/shop" },
  ctaSecondaryText: { type: String, default: "" },
  ctaSecondaryUrl:  { type: String, default: "" },
  image:          { type: String, default: "" },
  bgImage:        { type: String, default: "" },
  overlay:        { type: Boolean, default: true },
  overlayOpacity: { type: Number, default: 50 },     // 0-100
  textPosition:   { type: String, default: "left", enum: ["left", "center", "right"] },
}, { _id: false });

const TestimonialSchema = new Schema({
  name:   { type: String, default: "" },
  role:   { type: String, default: "" },
  text:   { type: String, default: "" },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  avatar: { type: String, default: "" },
  active: { type: Boolean, default: true },
}, { _id: true });

const TrustBadgeSchema = new Schema({
  icon:   { type: String, default: "ShieldCheck" },  // lucide icon name
  title:  { type: String, default: "" },
  text:   { type: String, default: "" },
  active: { type: Boolean, default: true },
}, { _id: true });

const WhyChooseUsItemSchema = new Schema({
  icon:   { type: String, default: "Star" },
  title:  { type: String, default: "" },
  text:   { type: String, default: "" },
  active: { type: Boolean, default: true },
}, { _id: true });

const HomepageCMSSchema = new Schema({
  hero:            { type: HeroSchema, default: () => ({}) },
  showFeatured:    { type: Boolean, default: true },
  showBestSellers: { type: Boolean, default: true },
  showNewArrivals: { type: Boolean, default: true },
  showBanners:     { type: Boolean, default: true },
  showTestimonials:{ type: Boolean, default: true },
  showNewsletter:  { type: Boolean, default: true },
  showWhyChooseUs: { type: Boolean, default: true },
  showTrustBadges: { type: Boolean, default: true },
  aboutTitle:      { type: String, default: "" },
  aboutText:       { type: String, default: "" },
  aboutImage:      { type: String, default: "" },
  testimonials:    { type: [TestimonialSchema], default: [] },
  trustBadges:     { type: [TrustBadgeSchema], default: [
    { icon: "Truck",        title: "Free Delivery",   text: "On orders over ₦100,000", active: true },
    { icon: "ShieldCheck",  title: "Secure Payment",  text: "100% protected payments", active: true },
    { icon: "Headphones",   title: "24/7 Support",    text: "Dedicated support team", active: true },
  ]},
  whyChooseUs:     { type: [WhyChooseUsItemSchema], default: [] },
  newsletterTitle:   { type: String, default: "Join the Mercy Family" },
  newsletterSubtext: { type: String, default: "Get 10% off your first order and early access to new arrivals." },
}, { _id: false });

// ─── Main Settings Interface ─────────────────────────────────
export interface ISettings extends Document {
  // Business Info (existing)
  businessName: string;
  tagline: string;
  logo: string;
  favicon: string;
  email: string;
  supportEmail: string;
  phone: string[];
  whatsapp: string;
  address: { street: string; city: string; state: string; country: string; postalCode: string };
  website: string;
  social: { instagram: string; facebook: string; twitter: string; tiktok: string; youtube: string; linkedin: string };
  footer: { description: string; copyright: string; links: { label: string; href: string }[] };
  about: string;
  meta: { title: string; description: string; keywords: string[] };
  shipping: { enabled: boolean; freeShippingEnabled: boolean; freeShippingThreshold: number; defaultShippingCost: number; currency: string };
  payments: { paystackEnabled: boolean; flutterwaveEnabled: boolean; codEnabled: boolean };
  notifications: { orderEmail: boolean; orderWhatsapp: boolean; adminEmail: string; adminPhone: string };
  announcement: { enabled: boolean; text: string; bgColor: string; textColor: string };
  homepage: { heroTitle: string; heroSubtitle: string; heroCta: string; heroCtaLink: string; heroImage: string; showFeaturedProducts: boolean; showBestSellers: boolean; showTestimonials: boolean; showNewsletter: boolean };
  maintenance: boolean;

  // ── NEW fields ──
  // Appearance
  brandColors: {
    primary: string; secondary: string; accent: string;
    success: string; warning: string; error: string;
  };
  uiColors: {
    headerBg: string; footerBg: string; navText: string; navTextHover: string;
    buttonPrimary: string; buttonText: string; linkColor: string;
    cardBg: string; pageBg: string; sectionAltBg: string;
    borderColor: string; textPrimary: string; textSecondary: string;
  };
  // Branding
  logos: {
    desktop: string; mobile: string; footer: string;
    admin: string; email: string; favicon: string;
  };
  seo: {
    metaTitle: string; metaDescription: string;
    ogImage: string; twitterCard: string; keywords: string;
  };
  // Homepage CMS
  homepageCMS: {
    hero: {
      headline: string; subheadline: string;
      ctaPrimaryText: string; ctaPrimaryUrl: string;
      ctaSecondaryText: string; ctaSecondaryUrl: string;
      image: string; bgImage: string; overlay: boolean;
      overlayOpacity: number; textPosition: "left" | "center" | "right";
    };
    showFeatured: boolean; showBestSellers: boolean; showNewArrivals: boolean;
    showBanners: boolean; showTestimonials: boolean; showNewsletter: boolean;
    showWhyChooseUs: boolean; showTrustBadges: boolean;
    aboutTitle: string; aboutText: string; aboutImage: string;
    testimonials: Array<{ _id?: string; name: string; role: string; text: string; rating: number; avatar: string; active: boolean }>;
    trustBadges: Array<{ _id?: string; icon: string; title: string; text: string; active: boolean }>;
    whyChooseUs: Array<{ _id?: string; icon: string; title: string; text: string; active: boolean }>;
    newsletterTitle: string; newsletterSubtext: string;
  };
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  // ── Existing fields (unchanged) ──
  businessName: { type: String, default: "Mercy Home Essentials" },
  tagline:      { type: String, default: "Premium Home Goods" },
  logo:         { type: String, default: "" },
  favicon:      { type: String, default: "" },
  email:        { type: String, default: "" },
  supportEmail: { type: String, default: "" },
  phone:        { type: [String], default: [] },
  whatsapp:     { type: String, default: "" },
  address: {
    street: { type: String, default: "" }, city: { type: String, default: "" },
    state:  { type: String, default: "" }, country: { type: String, default: "Nigeria" },
    postalCode: { type: String, default: "" },
  },
  website: { type: String, default: "" },
  social: {
    instagram: { type: String, default: "" }, facebook: { type: String, default: "" },
    twitter:   { type: String, default: "" }, tiktok:   { type: String, default: "" },
    youtube:   { type: String, default: "" }, linkedin: { type: String, default: "" },
  },
  footer: {
    description: { type: String, default: "" },
    copyright:   { type: String, default: "" },
    links:       { type: [{ label: String, href: String }], default: [] },
  },
  about: { type: String, default: "" },
  meta: {
    title:       { type: String, default: "" },
    description: { type: String, default: "" },
    keywords:    { type: [String], default: [] },
  },
  shipping: {
    enabled:               { type: Boolean, default: true },
    freeShippingEnabled:   { type: Boolean, default: true },
    freeShippingThreshold: { type: Number,  default: 100000 },
    defaultShippingCost:   { type: Number,  default: 2500 },
    currency:              { type: String,  default: "NGN" },
  },
  payments: {
    paystackEnabled:    { type: Boolean, default: true },
    flutterwaveEnabled: { type: Boolean, default: false },
    codEnabled:         { type: Boolean, default: false },
  },
  notifications: {
    orderEmail:    { type: Boolean, default: true },
    orderWhatsapp: { type: Boolean, default: false },
    adminEmail:    { type: String,  default: "" },
    adminPhone:    { type: String,  default: "" },
  },
  announcement: {
    enabled:   { type: Boolean, default: false },
    text:      { type: String,  default: "Free shipping on orders over ₦100,000 · Quality you can trust" },
    bgColor:   { type: String,  default: "#1a1108" },
    textColor: { type: String,  default: "#f5f0e8" },
  },
  homepage: {
    heroTitle:            { type: String,  default: "Elevate Your Home" },
    heroSubtitle:         { type: String,  default: "Discover premium home essentials." },
    heroCta:              { type: String,  default: "Shop Collection" },
    heroCtaLink:          { type: String,  default: "/shop" },
    heroImage:            { type: String,  default: "" },
    showFeaturedProducts: { type: Boolean, default: true },
    showBestSellers:      { type: Boolean, default: true },
    showTestimonials:     { type: Boolean, default: true },
    showNewsletter:       { type: Boolean, default: true },
  },
  maintenance: { type: Boolean, default: false },

  // ── NEW fields ──
  brandColors: { type: BrandColorsSchema, default: () => ({}) },
  uiColors:    { type: UIColorsSchema,    default: () => ({}) },
  logos:       { type: LogosSchema,       default: () => ({}) },
  seo: {
    type: SEOSchema,
    default: () => ({
      metaTitle: "Mercy Home Essentials — Premium Home Goods",
      metaDescription: "Discover premium home essentials crafted for modern living.",
    }),
  },
  homepageCMS: { type: HomepageCMSSchema, default: () => ({}) },

}, { timestamps: true });

// ─── Singleton helper ────────────────────────────────────────
SettingsSchema.statics.getSingleton = async function () {
  let s = await this.findOne();
  if (!s) s = await this.create({});
  return s;
};

const Settings: Model<ISettings> =
  mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
