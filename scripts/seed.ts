import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Inline minimal models for seeding
const CategorySchema = new mongoose.Schema({
  name: String, slug: String, description: String, image: String,
  isActive: { type: Boolean, default: true }, sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: String, slug: String, description: String, shortDescription: String,
  images: [{ url: String, alt: String, isPrimary: Boolean }],
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  price: Number, comparePrice: Number, sku: String,
  stock: { type: Number, default: 50 },
  lowStockThreshold: { type: Number, default: 5 },
  trackInventory: { type: Boolean, default: true },
  variants: [{ name: String, value: String, price: Number, stock: Number }],
  tags: [String], rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  isFeatured: Boolean, isActive: { type: Boolean, default: true },
  isBestSeller: Boolean, isNewArrival: Boolean,
  attributes: [{ name: String, value: String }],
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true },
  password: String, role: { type: String, default: "user" },
  isVerified: { type: Boolean, default: true },
}, { timestamps: true });

const CouponSchema = new mongoose.Schema({
  code: { type: String, unique: true }, description: String,
  type: { type: String, enum: ["percent","fixed","free_shipping"] },
  value: Number, minOrderAmount: Number,
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
}, { timestamps: true });

const Category  = mongoose.models.Category  ?? mongoose.model("Category",  CategorySchema);
const Product   = mongoose.models.Product   ?? mongoose.model("Product",   ProductSchema);
const User      = mongoose.models.User      ?? mongoose.model("User",      UserSchema);
const Coupon    = mongoose.models.Coupon    ?? mongoose.model("Coupon",    CouponSchema);

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("✅ Connected to MongoDB");

  // Clear existing
  await Promise.all([Category.deleteMany({}), Product.deleteMany({}), Coupon.deleteMany({})]);
  console.log("🗑️  Cleared existing data");

  // ─── Categories ──────────────────────────────────────────
  const categories = await Category.insertMany([
    { name: "Bedding",       slug: "bedding",       description: "Premium sheets, duvets, and pillows",          image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80", sortOrder: 1 },
    { name: "Kitchenware",   slug: "kitchenware",   description: "Quality pots, pans, and kitchen accessories",  image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80", sortOrder: 2 },
    { name: "Home Decor",    slug: "home-decor",    description: "Beautiful accents for every room",             image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80", sortOrder: 3 },
    { name: "Bath & Body",   slug: "bath-body",     description: "Spa-grade bath and personal care",             image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80", sortOrder: 4 },
    { name: "Lighting",      slug: "lighting",      description: "Set the perfect mood in any room",             image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", sortOrder: 5 },
  ]);
  console.log(`📁 Created ${categories.length} categories`);

  const [bedding, kitchen, decor, bath, lighting] = categories;

  // ─── Products ────────────────────────────────────────────
  const productData = [
    // Bedding
    {
      name: "Egyptian Cotton Duvet Set — King",
      slug: "egyptian-cotton-duvet-set-king",
      shortDescription: "800-thread-count Egyptian cotton. Breathable, temperature-regulating, and exceptionally soft.",
      description: "<p>Crafted from the finest long-staple Egyptian cotton, this 800-thread-count duvet set brings hotel-level luxury to your bedroom. The breathable weave keeps you cool in summer and warm in winter.</p><p>Includes: 1 duvet cover + 2 pillowcases. Available in King size.</p>",
      images: [
        { url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80", alt: "Egyptian Cotton Duvet", isPrimary: true },
        { url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80", alt: "Duvet detail" },
      ],
      category: bedding._id,
      price: 28500, comparePrice: 35000, sku: "BED-ECD-KING-001",
      variants: [
        { name: "Color", value: "Pearl White",   stock: 25 },
        { name: "Color", value: "Ivory",         stock: 20 },
        { name: "Color", value: "Slate Grey",    stock: 15 },
      ],
      tags: ["bedding", "cotton", "luxury", "king"],
      attributes: [
        { name: "Material",       value: "100% Egyptian Cotton" },
        { name: "Thread Count",   value: "800TC" },
        { name: "Size",           value: "King (230×220cm)" },
        { name: "Care",           value: "Machine washable 40°C" },
      ],
      isFeatured: true, isBestSeller: true, isNewArrival: false,
      rating: 4.8, reviewCount: 127, stock: 60,
    },
    {
      name: "Bamboo Silk Pillowcase Set",
      slug: "bamboo-silk-pillowcase-set",
      shortDescription: "Ultra-smooth bamboo-silk blend. Gentle on hair, kind to skin.",
      description: "<p>Our bamboo-silk pillowcases offer the smoothest sleep surface possible. The natural fibres are hypoallergenic, moisture-wicking, and temperature-regulating. Set of 2 in standard size.</p>",
      images: [
        { url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80", alt: "Bamboo pillowcase", isPrimary: true },
      ],
      category: bedding._id,
      price: 9800, comparePrice: 12500, sku: "BED-BSP-STD-001",
      variants: [
        { name: "Color", value: "White",        stock: 40 },
        { name: "Color", value: "Blush Pink",   stock: 30 },
        { name: "Color", value: "Sage Green",   stock: 25 },
      ],
      tags: ["pillowcase", "bamboo", "silk", "skincare"],
      attributes: [{ name: "Material", value: "Bamboo-Silk Blend" }, { name: "Size", value: "Standard (50×75cm)" }],
      isFeatured: true, isBestSeller: false, isNewArrival: true,
      rating: 4.7, reviewCount: 89, stock: 95,
    },
    // Kitchenware
    {
      name: "Cast Iron Dutch Oven — 5.5L",
      slug: "cast-iron-dutch-oven-5l",
      shortDescription: "Heirloom-quality cast iron. Oven-safe to 260°C, works on all hobs.",
      description: "<p>This 5.5-litre cast iron Dutch oven is built to last generations. The tight-fitting lid locks in moisture and flavour. Pre-seasoned and ready to use from day one. Compatible with all cooker types including induction.</p>",
      images: [
        { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", alt: "Cast Iron Dutch Oven", isPrimary: true },
      ],
      category: kitchen._id,
      price: 22000, comparePrice: 28000, sku: "KIT-CIDO-5L-001",
      variants: [
        { name: "Color", value: "Cherry Red",     stock: 20 },
        { name: "Color", value: "Midnight Black",  stock: 25 },
        { name: "Color", value: "Cream",           stock: 15 },
      ],
      tags: ["cookware", "cast iron", "dutch oven"],
      attributes: [
        { name: "Capacity",    value: "5.5 Litres" },
        { name: "Material",    value: "Cast Iron with Enamel Coating" },
        { name: "Oven Safe",   value: "Up to 260°C" },
        { name: "Compatible",  value: "All hob types including induction" },
      ],
      isFeatured: true, isBestSeller: true, isNewArrival: false,
      rating: 4.9, reviewCount: 204, stock: 60,
    },
    {
      name: "Japanese Knife Set — 5 Piece",
      slug: "japanese-knife-set-5-piece",
      shortDescription: "Professional-grade German stainless steel. Ergonomic handles. Full tang.",
      description: "<p>Five essential kitchen knives crafted from high-carbon German stainless steel. Ultra-sharp 15° edge angle. Ergonomic pakkawood handles. Includes: chef's knife, santoku, bread, utility, paring knife. Comes in elegant wooden block.</p>",
      images: [
        { url: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80", alt: "Knife set", isPrimary: true },
      ],
      category: kitchen._id,
      price: 18500, sku: "KIT-JKS-5PC-001",
      tags: ["knives", "kitchen", "professional", "gift"],
      attributes: [
        { name: "Blade Material", value: "High-Carbon Stainless Steel" },
        { name: "Handle",         value: "Pakkawood" },
        { name: "Includes",       value: "5 knives + wooden block" },
      ],
      isFeatured: false, isBestSeller: true, isNewArrival: false,
      rating: 4.6, reviewCount: 78, stock: 35,
    },
    // Decor
    {
      name: "Handwoven Jute Rug — 160×230cm",
      slug: "handwoven-jute-rug-160x230",
      shortDescription: "Natural jute fibres hand-woven by artisans. Brings warmth and texture to any room.",
      description: "<p>Our signature jute rug is handwoven by skilled artisans using sustainably harvested natural fibres. The neutral tones work beautifully with any colour scheme. Durable, eco-friendly, and uniquely textured.</p>",
      images: [
        { url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", alt: "Jute rug", isPrimary: true },
      ],
      category: decor._id,
      price: 15800, comparePrice: 19500, sku: "DEC-JR-160230-001",
      tags: ["rug", "jute", "natural", "artisan", "decor"],
      attributes: [
        { name: "Material", value: "100% Natural Jute" },
        { name: "Size",     value: "160 × 230cm" },
        { name: "Style",    value: "Handwoven" },
        { name: "Care",     value: "Spot clean only" },
      ],
      isFeatured: true, isBestSeller: false, isNewArrival: true,
      rating: 4.5, reviewCount: 56, stock: 22,
    },
    {
      name: "Scented Soy Candle Collection — Set of 4",
      slug: "scented-soy-candle-set-4",
      shortDescription: "Pure soy wax. 50 hours burn time per candle. Hand-poured in Lagos.",
      description: "<p>Our signature candle collection features four complementary scents — Warm Amber, Fresh Linen, Bergamot & Cedar, and Nigerian Rose. Each candle is hand-poured using 100% soy wax and premium fragrance oils with cotton wicks.</p>",
      images: [
        { url: "https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=800&q=80", alt: "Soy candles", isPrimary: true },
      ],
      category: decor._id,
      price: 8500, sku: "DEC-SC-SET4-001",
      tags: ["candle", "soy", "scented", "gift", "handmade"],
      attributes: [{ name: "Wax", value: "100% Soy" }, { name: "Burn Time", value: "50 hrs each" }],
      isFeatured: false, isBestSeller: true, isNewArrival: true,
      rating: 4.7, reviewCount: 112, stock: 80,
    },
    // Bath
    {
      name: "Spa Luxury Towel Set — 6 Piece",
      slug: "spa-luxury-towel-set-6-piece",
      shortDescription: "600gsm zero-twist cotton. Soft, absorbent, and quick-drying.",
      description: "<p>Our spa-grade towel set features 600gsm zero-twist cotton for unmatched softness and fast absorbency. Each set includes 2 bath towels, 2 hand towels, and 2 face cloths. OEKO-TEX certified — safe for all skin types.</p>",
      images: [
        { url: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80", alt: "Spa towel set", isPrimary: true },
      ],
      category: bath._id,
      price: 12500, comparePrice: 15000, sku: "BTH-STS-6PC-001",
      variants: [
        { name: "Color", value: "Pure White",   stock: 40 },
        { name: "Color", value: "Storm Grey",   stock: 30 },
        { name: "Color", value: "Dusty Rose",   stock: 20 },
      ],
      tags: ["towels", "bath", "cotton", "spa", "gift"],
      attributes: [
        { name: "Material",  value: "600gsm Zero-Twist Cotton" },
        { name: "Pieces",    value: "6 (2 bath + 2 hand + 2 face)" },
        { name: "Certified", value: "OEKO-TEX Standard 100" },
      ],
      isFeatured: true, isBestSeller: true, isNewArrival: false,
      rating: 4.8, reviewCount: 163, stock: 90,
    },
    // Lighting
    {
      name: "Rattan Pendant Light — Natural",
      slug: "rattan-pendant-light-natural",
      shortDescription: "Handcrafted rattan. Warm diffused light. Bohemian charm for any room.",
      description: "<p>This handcrafted rattan pendant creates a beautiful warm glow, perfect for living rooms, bedrooms, or dining spaces. The natural rattan weave casts enchanting shadow patterns. Adjustable cord length. Bulb not included.</p>",
      images: [
        { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", alt: "Rattan pendant light", isPrimary: true },
      ],
      category: lighting._id,
      price: 11500, sku: "LIT-RPL-NAT-001",
      tags: ["lighting", "rattan", "pendant", "boho", "decor"],
      attributes: [
        { name: "Material",  value: "Natural Rattan" },
        { name: "Diameter",  value: "40cm" },
        { name: "Bulb Type", value: "E27 (not included)" },
        { name: "Cord",      value: "Adjustable up to 150cm" },
      ],
      isFeatured: true, isBestSeller: false, isNewArrival: true,
      rating: 4.4, reviewCount: 43, stock: 28,
    },
  ];

  const products = await Product.insertMany(productData);
  console.log(`📦 Created ${products.length} products`);

  // ─── Coupons ─────────────────────────────────────────────
  await Coupon.insertMany([
    { code: "WELCOME10", description: "10% off for new customers", type: "percent", value: 10, minOrderAmount: 5000, isActive: true },
    { code: "FLAT2000",  description: "₦2,000 off orders above ₦20,000", type: "fixed", value: 2000, minOrderAmount: 20000, isActive: true },
    { code: "FREESHIP",  description: "Free shipping on any order", type: "free_shipping", value: 0, isActive: true },
  ]);
  console.log("🏷️  Created 3 coupons");

  // ─── Admin user ──────────────────────────────────────────
  const adminExists = await User.findOne({ email: "admin@mercyhomeessentials.com" });
  if (!adminExists) {
    const hashed = await bcrypt.hash("Admin@123456", 12);
    await User.create({
      name: "Admin",
      email: "admin@mercyhomeessentials.com",
      password: hashed,
      role: "admin",
      isVerified: true,
    });
    console.log("👤 Admin user created: admin@mercyhomeessentials.com / Admin@123456");
  }

  console.log("\n✅ Database seeded successfully!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
