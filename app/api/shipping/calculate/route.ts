import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Settings from "@/lib/models/Settings";

// ── Public: Calculate shipping based on state/location ────────────────────────
// Called from checkout page to get shipping estimate
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { state, orderTotal } = body;

    const settings = await (Settings as any).getSingleton();
    const threshold = settings?.shipping?.freeShippingThreshold ?? 50000;

    // Free shipping if order total exceeds threshold
    if (orderTotal >= threshold) {
      return NextResponse.json({
        success: true,
        data: {
          cost: 0,
          label: "Free Shipping",
          estimatedDays: "3-5",
          isFree: true,
        },
      });
    }

    // Location-based shipping rates (Nigerian states)
    const lagosAreas = ["lagos"];
    const southwestStates = ["ogun", "oyo", "osun", "ekiti", "ondo"];
    const southsouthStates = ["rivers", "delta", "bayelsa", "edo", "cross river", "akwa ibom"];
    const southeastStates = ["anambra", "imo", "enugu", "ebonyi", "abia"];
    const northStates = ["kano", "kaduna", "katsina", "sokoto", "kebbi", "zamfara", "jigawa",
      "bauchi", "gombe", "yobe", "borno", "adamawa", "taraba", "plateau",
      "nassarawa", "benue", "kogi", "kwara", "niger", "fct", "abuja"];

    const stateLower = (state ?? "").toLowerCase().trim();

    let cost = settings?.shipping?.defaultShippingCost ?? 2500;
    let label = "Standard Delivery";
    let estimatedDays = "5-7";

    if (lagosAreas.some((s) => stateLower.includes(s))) {
      cost = 1500;
      label = "Lagos Delivery";
      estimatedDays = "1-2";
    } else if (southwestStates.some((s) => stateLower.includes(s))) {
      cost = 2000;
      label = "Southwest Delivery";
      estimatedDays = "2-4";
    } else if ([...southsouthStates, ...southeastStates].some((s) => stateLower.includes(s))) {
      cost = 2500;
      label = "South Delivery";
      estimatedDays = "3-5";
    } else if (northStates.some((s) => stateLower.includes(s))) {
      cost = 3500;
      label = "North Delivery";
      estimatedDays = "5-7";
    }

    return NextResponse.json({
      success: true,
      data: { cost, label, estimatedDays, isFree: false },
    });
  } catch (error) {
    console.error("[POST /api/shipping/calculate]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// ── Admin: Get shipping config ─────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const settings = await (Settings as any).getSingleton();
    return NextResponse.json({
      success: true,
      data: settings?.shipping ?? {},
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
