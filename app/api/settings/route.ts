import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/lib/models/Settings";

// Public endpoint — used by header, footer, contact page, etc.
export async function GET() {
  try {
    await connectDB();
    const settings = await (Settings as any).getSingleton();
    return NextResponse.json({ success: true, data: settings }, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
