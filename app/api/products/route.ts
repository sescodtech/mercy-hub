import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product, Category } from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit    = Math.min(50, Number(searchParams.get("limit") ?? 12));
    const sort     = searchParams.get("sort")     ?? "newest";
    const search   = searchParams.get("search")   ?? "";
    const category = searchParams.get("category") ?? "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock  = searchParams.get("inStock")  === "true";
    const filter   = searchParams.get("filter")   ?? "";

    // Build query
    const query: Record<string, unknown> = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      const cat = await Category.findOne({ slug: category });
      if (cat) query.category = cat._id;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
    }

    if (inStock)        query.stock   = { $gt: 0 };
    if (filter === "new")        query.isNewArrival = true;
    if (filter === "sale")       query.comparePrice = { $exists: true, $gt: 0 };
    if (filter === "bestseller") query.isBestSeller = true;
    if (filter === "featured")   query.isFeatured   = true;

    // Sort
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest:     { createdAt: -1 },
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      rating:     { rating: -1 },
      popular:    { reviewCount: -1 },
    };
    const sortQuery = sortMap[sort] ?? sortMap.newest;

    const skip  = (page - 1) * limit;
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate required
    if (!body.name || !body.price || !body.category || !body.sku) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const product = await Product.create(body);
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: number; keyPattern?: Record<string, unknown> };
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern ?? {})[0];
      return NextResponse.json({ success: false, error: `${field} already exists` }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
