import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { auth } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

// GET /api/admin/products/[id]/variants — list all colour variants for a product
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id).select("colorVariants hasColorVariants name").lean();
    if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: product });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/admin/products/[id]/variants — add a new colour variant
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await connectDB();

    const body = await req.json();
    const { label, colorHex, images, sku, priceOverride, stock, enabled, sortOrder } = body;

    if (!label?.trim() || !colorHex) {
      return NextResponse.json({ success: false, error: "Label and colorHex are required" }, { status: 400 });
    }

    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const newVariant = {
      label:         label.trim(),
      colorHex,
      images:        images ?? [],
      sku:           sku?.trim() ?? "",
      priceOverride: priceOverride ?? null,
      stock:         Number(stock ?? 0),
      enabled:       enabled ?? true,
      sortOrder:     sortOrder ?? product.colorVariants.length,
    };

    product.colorVariants.push(newVariant as any);
    product.hasColorVariants = true;
    await product.save();

    const added = product.colorVariants[product.colorVariants.length - 1];
    return NextResponse.json({ success: true, data: added }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/products/[id]/variants]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PUT /api/admin/products/[id]/variants — bulk replace / reorder all colour variants
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await connectDB();

    const { variants } = await req.json();
    if (!Array.isArray(variants)) {
      return NextResponse.json({ success: false, error: "variants must be an array" }, { status: 400 });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          colorVariants: variants,
          hasColorVariants: variants.length > 0,
        },
      },
      { new: true }
    ).select("colorVariants hasColorVariants");

    if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("[PUT /api/admin/products/[id]/variants]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id]/variants?variantId=xxx — remove one colour variant
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const variantId = new URL(req.url).searchParams.get("variantId");
    if (!variantId) {
      return NextResponse.json({ success: false, error: "variantId required" }, { status: 400 });
    }
    await connectDB();

    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    product.colorVariants = product.colorVariants.filter(
      (v: any) => v._id.toString() !== variantId
    ) as any;
    product.hasColorVariants = product.colorVariants.length > 0;
    await product.save();

    return NextResponse.json({ success: true, message: "Variant removed" });
  } catch (error) {
    console.error("[DELETE /api/admin/products/[id]/variants]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
