import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import { auth } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    const category = await Category.findById(id).lean();
    if (!category) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: category });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    await connectDB();
    const body = await req.json();
    delete body._id;
    const category = await Category.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!category) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: category });
  } catch {
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

    // Check if products use this category
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot delete — ${productCount} product(s) use this category. Reassign them first.`,
      }, { status: 400 });
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
