import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/lib/models/Settings";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const settings = await (Settings as any).getSingleton();
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();

    // Remove protected fields
    delete body._id;
    delete body.__v;
    delete body.createdAt;

    const settings = await (Settings as any).getSingleton();
    Object.assign(settings, body);
    await settings.save();

    return NextResponse.json({ success: true, data: settings, message: "Settings saved successfully" });
  } catch (error) {
    console.error("[PUT /api/admin/settings]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
