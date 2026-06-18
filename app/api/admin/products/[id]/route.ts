import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models";
import { auth } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await connectDB();
    const product = await Product.findById(id).populate("category", "name slug").lean();
    if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: product });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    delete body._id; delete body.__v; delete body.createdAt;

    // Recalculate slug if name changed
    if (body.name) {
      const existing = await Product.findById(id);
      if (existing && existing.name !== body.name) {
        let slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const conflict = await Product.findOne({ slug, _id: { $ne: id } });
        if (conflict) slug = `${slug}-${Date.now()}`;
        body.slug = slug;
      }
    }

    const product = await Product.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true })
      .populate("category", "name slug");
    if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: product, message: "Product updated" });
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    if (err.name === "ValidationError") {
      return NextResponse.json({ success: false, error: err.message || "Validation failed" }, { status: 400 });
    }
    console.error("[PUT /api/admin/products/:id]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await connectDB();
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
