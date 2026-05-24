import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models";
import { auth } from "@/lib/auth";

// Public GET — used by shop filters, product forms, nav
export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    return NextResponse.json({ success: true, data: categories }, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// Admin POST — create category
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();
    const { name, description, image, parentCategory, sortOrder } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }

    // Auto-generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json({ success: false, error: "Category already exists" }, { status: 400 });
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description,
      image,
      parentCategory: parentCategory || null,
      sortOrder: sortOrder ?? 0,
      isActive: true,
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      return NextResponse.json({ success: false, error: "Category already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
