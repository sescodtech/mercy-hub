import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/lib/models/Settings";

// Public GET — returns all non-sensitive settings for frontend consumption
// Cached by Next.js for 5 minutes via Cache-Control header
export async function GET() {
  try {
    await connectDB();
    const settings = await (Settings as any).getSingleton();

    // Return full settings doc — no sensitive server-only fields to hide here
    // (no API keys are stored in Settings)
    return NextResponse.json(
      { success: true, data: settings },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load settings" },
      { status: 500 }
    );
  }
}
