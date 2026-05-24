import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Banner } from "@/lib/models";
import { auth } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

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
    const banner = await Banner.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!banner) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: banner });
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
    await Banner.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
