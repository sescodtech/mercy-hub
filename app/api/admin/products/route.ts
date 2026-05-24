import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product, Category } from "@/lib/models";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, Number(searchParams.get("page")     ?? 1));
    const limit    = Math.min(50, Number(searchParams.get("limit")    ?? 20));
    const search   = searchParams.get("search")   ?? "";
    const category = searchParams.get("category") ?? "";
    const status   = searchParams.get("status")   ?? "";
    const skip     = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (search)   query.$or        = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }];
    if (category) query.category   = category;
    if (status === "active")   query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (status === "low")      query.$expr    = { $lte: ["$stock", "$lowStockThreshold"] };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true, data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/products]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();

    const {
      name, description, shortDescription, price, comparePrice,
      category, images, variants, attributes, tags,
      stock, lowStockThreshold, trackInventory,
      sku, weight, isActive, isFeatured, isNewArrival, seo,
    } = body;

    if (!name?.trim() || !price || !category) {
      return NextResponse.json({ success: false, error: "Name, price, and category are required" }, { status: 400 });
    }

    // Auto slug
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const existing = await Product.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const product = await Product.create({
      name: name.trim(), slug, description, shortDescription,
      price: Number(price), comparePrice: comparePrice ? Number(comparePrice) : undefined,
      category, images: images ?? [], variants: variants ?? [],
      attributes: attributes ?? [], tags: tags ?? [],
      stock: Number(stock ?? 0), lowStockThreshold: Number(lowStockThreshold ?? 5),
      trackInventory: trackInventory ?? true,
      sku: sku?.trim(), weight: weight ? Number(weight) : undefined,
      isActive: isActive ?? true, isFeatured: isFeatured ?? false,
      isNewArrival: isNewArrival ?? false, seo: seo ?? {},
      rating: 0, reviewCount: 0,
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      return NextResponse.json({ success: false, error: "SKU already exists" }, { status: 400 });
    }
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
