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

    // Strip non-editable fields
    delete body._id;
    delete body.__v;
    delete body.createdAt;

    const settings = await (Settings as any).getSingleton();
    Object.assign(settings, body);
    await settings.save();

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("[PUT /api/admin/settings]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PATCH — update only a specific section (appearance, branding, homepageCMS, etc.)
// Body: { section: "brandColors" | "uiColors" | "logos" | "seo" | "homepageCMS", data: {...} }
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    await connectDB();

    const { section, data } = await req.json();
    const allowed = ["brandColors", "uiColors", "logos", "seo", "homepageCMS",
      "announcement", "homepage", "shipping", "payments", "notifications",
      "social", "footer", "meta"];

    if (!allowed.includes(section)) {
      return NextResponse.json({ success: false, error: "Invalid section" }, { status: 400 });
    }

    const settings = await (Settings as any).getSingleton();
    settings[section] = { ...settings[section]?.toObject?.() ?? settings[section], ...data };
    await settings.save();

    return NextResponse.json({
      success: true,
      data: settings[section],
      message: `${section} updated`,
    });
  } catch (error) {
    console.error("[PATCH /api/admin/settings]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
