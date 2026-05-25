import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Banner } from "@/lib/models";
import { auth } from "@/lib/auth";

// Public GET — used by HeroSection
export async function GET() {
  try {
    await connectDB();
    const banners = await Banner.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
    return NextResponse.json({ success: true, data: banners }, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    });
  } catch {
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
    // Match your existing BannerSchema field names
    const { title, subtitle, image, mobileImage, buttonText, link, badge, sortOrder } = body;

    if (!title || !image) {
      return NextResponse.json({ success: false, error: "Title and image are required" }, { status: 400 });
    }

    const banner = await Banner.create({
      title, subtitle, image, mobileImage,
      buttonText: buttonText || "Shop Now",
      link:       link       || "/shop",
      sortOrder:  sortOrder  ?? 0,
      isActive:   true,
    });
    return NextResponse.json({ success: true, data: banner }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
