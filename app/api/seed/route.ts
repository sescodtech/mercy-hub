import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category, Product, Coupon, User } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({}),
    ]);

    const categories = await Category.insertMany([
      { name: "Bedding",     slug: "bedding",     isActive: true, sortOrder: 1 },
      { name: "Kitchenware", slug: "kitchenware", isActive: true, sortOrder: 2 },
      { name: "Home Decor",  slug: "home-decor",  isActive: true, sortOrder: 3 },
      { name: "Bath & Body", slug: "bath-body",   isActive: true, sortOrder: 4 },
      { name: "Lighting",    slug: "lighting",    isActive: true, sortOrder: 5 },
    ]);

    const [bedding, kitchen, decor, bath, lighting] = categories;

    await Product.insertMany([
      {
        name: "Egyptian Cotton Duvet Set",
        slug: "egyptian-cotton-duvet-set",
        description: "Premium 800-thread-count Egyptian cotton duvet set.",
        shortDescription: "Luxuriously soft Egyptian cotton bedding.",
        images: [{ url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80", isPrimary: true }],
        category: bedding._id,
        price: 28500, comparePrice: 35000,
        sku: "BED-001", stock: 50,
        lowStockThreshold: 5, trackInventory: true,
        variants: [
          { name: "Color", value: "White", stock: 20 },
          { name: "Color", value: "Ivory", stock: 20 },
        ],
        tags: ["bedding", "cotton", "luxury"],
        rating: 4.8, reviewCount: 127,
        isFeatured: true, isActive: true, isBestSeller: true, isNewArrival: false,
        attributes: [{ name: "Material", value: "Egyptian Cotton" }, { name: "Thread Count", value: "800TC" }],
      },
      {
        name: "Cast Iron Dutch Oven 5.5L",
        slug: "cast-iron-dutch-oven",
        description: "Heirloom-quality cast iron Dutch oven.",
        shortDescription: "Perfect for slow cooking and baking.",
        images: [{ url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80", isPrimary: true }],
        category: kitchen._id,
        price: 22000, comparePrice: 28000,
        sku: "KIT-001", stock: 30,
        lowStockThreshold: 5, trackInventory: true,
        variants: [
          { name: "Color", value: "Red", stock: 15 },
          { name: "Color", value: "Black", stock: 15 },
        ],
        tags: ["cookware", "cast iron"],
        rating: 4.9, reviewCount: 204,
        isFeatured: true, isActive: true, isBestSeller: true, isNewArrival: false,
        attributes: [{ name: "Capacity", value: "5.5L" }, { name: "Material", value: "Cast Iron" }],
      },
      {
        name: "Bamboo Silk Pillowcase Set",
        slug: "bamboo-silk-pillowcase-set",
        description: "Ultra-smooth bamboo-silk blend pillowcases.",
        shortDescription: "Gentle on hair and skin.",
        images: [{ url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80", isPrimary: true }],
        category: bedding._id,
        price: 9800, comparePrice: 12500,
        sku: "BED-002", stock: 60,
        lowStockThreshold: 5, trackInventory: true,
        tags: ["pillowcase", "bamboo", "silk"],
        rating: 4.7, reviewCount: 89,
        isFeatured: true, isActive: true, isBestSeller: false, isNewArrival: true,
        attributes: [{ name: "Material", value: "Bamboo-Silk" }],
        variants: [],
      },
      {
        name: "Spa Luxury Towel Set 6 Piece",
        slug: "spa-luxury-towel-set",
        description: "600gsm zero-twist cotton towel set.",
        shortDescription: "Spa-grade softness for your bathroom.",
        images: [{ url: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80", isPrimary: true }],
        category: bath._id,
        price: 12500, comparePrice: 15000,
        sku: "BTH-001", stock: 45,
        lowStockThreshold: 5, trackInventory: true,
        tags: ["towels", "bath", "spa"],
        rating: 4.8, reviewCount: 163,
        isFeatured: true, isActive: true, isBestSeller: true, isNewArrival: false,
        attributes: [{ name: "Material", value: "600gsm Cotton" }, { name: "Pieces", value: "6" }],
        variants: [
          { name: "Color", value: "White", stock: 20 },
          { name: "Color", value: "Grey", stock: 15 },
        ],
      },
      {
        name: "Handwoven Jute Rug 160x230cm",
        slug: "handwoven-jute-rug",
        description: "Natural jute rug handwoven by skilled artisans.",
        shortDescription: "Brings warmth and texture to any room.",
        images: [{ url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80", isPrimary: true }],
        category: decor._id,
        price: 15800, comparePrice: 19500,
        sku: "DEC-001", stock: 20,
        lowStockThreshold: 3, trackInventory: true,
        tags: ["rug", "jute", "decor"],
        rating: 4.5, reviewCount: 56,
        isFeatured: true, isActive: true, isBestSeller: false, isNewArrival: true,
        attributes: [{ name: "Material", value: "Natural Jute" }, { name: "Size", value: "160x230cm" }],
        variants: [],
      },
      {
        name: "Rattan Pendant Light",
        slug: "rattan-pendant-light",
        description: "Handcrafted rattan pendant light.",
        shortDescription: "Creates beautiful warm glow in any room.",
        images: [{ url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", isPrimary: true }],
        category: lighting._id,
        price: 11500,
        sku: "LIT-001", stock: 25,
        lowStockThreshold: 3, trackInventory: true,
        tags: ["lighting", "rattan", "pendant"],
        rating: 4.4, reviewCount: 43,
        isFeatured: true, isActive: true, isBestSeller: false, isNewArrival: true,
        attributes: [{ name: "Material", value: "Natural Rattan" }, { name: "Diameter", value: "40cm" }],
        variants: [],
      },
      {
        name: "Scented Soy Candle Set of 4",
        slug: "scented-soy-candle-set",
        description: "Hand-poured soy wax candles with premium fragrances.",
        shortDescription: "50 hours burn time per candle.",
        images: [{ url: "https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=800&q=80", isPrimary: true }],
        category: decor._id,
        price: 8500,
        sku: "DEC-002", stock: 80,
        lowStockThreshold: 10, trackInventory: true,
        tags: ["candle", "soy", "gift"],
        rating: 4.7, reviewCount: 112,
        isFeatured: false, isActive: true, isBestSeller: true, isNewArrival: true,
        attributes: [{ name: "Wax", value: "100% Soy" }, { name: "Burn Time", value: "50hrs each" }],
        variants: [],
      },
      {
        name: "Japanese Knife Set 5 Piece",
        slug: "japanese-knife-set",
        description: "Professional-grade German stainless steel knife set.",
        shortDescription: "Ultra-sharp blades with ergonomic handles.",
        images: [{ url: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80", isPrimary: true }],
        category: kitchen._id,
        price: 18500,
        sku: "KIT-002", stock: 35,
        lowStockThreshold: 5, trackInventory: true,
        tags: ["knives", "kitchen", "professional"],
        rating: 4.6, reviewCount: 78,
        isFeatured: false, isActive: true, isBestSeller: true, isNewArrival: false,
        attributes: [{ name: "Blade", value: "German Steel" }, { name: "Pieces", value: "5 + Block" }],
        variants: [],
      },
    ]);

    await Coupon.insertMany([
      { code: "WELCOME10", type: "percent", value: 10, minOrderAmount: 5000, isActive: true, usageCount: 0 },
      { code: "FLAT2000",  type: "fixed",   value: 2000, minOrderAmount: 20000, isActive: true, usageCount: 0 },
      { code: "FREESHIP",  type: "free_shipping", value: 0, isActive: true, usageCount: 0 },
    ]);

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
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      data: { categories: 5, products: 8, coupons: 3 }
    });

  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}