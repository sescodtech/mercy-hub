import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Settings from "@/lib/models/Settings";

// Free delivery threshold — ₦100,000
const FREE_DELIVERY_THRESHOLD = 100000;

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { state, orderTotal } = await req.json();
    const settings  = await (Settings as any).getSingleton();
    const shipping  = settings?.shipping;

    // Shipping disabled globally — always free
    if (!shipping?.enabled) {
      return NextResponse.json({
        success: true,
        data: { cost: 0, label: "Free Delivery", estimatedDays: "3-5", isFree: true },
      });
    }

    // Free delivery on orders ₦100,000 and above
    const threshold = shipping.freeShippingThreshold ?? FREE_DELIVERY_THRESHOLD;
    if (shipping.freeShippingEnabled && orderTotal >= threshold) {
      return NextResponse.json({
        success: true,
        data: {
          cost: 0,
          label: "Free Delivery",
          estimatedDays: "3-5",
          isFree: true,
          message: `Free delivery on orders above ₦${threshold.toLocaleString()}`,
        },
      });
    }

    // Location-based rates
    const stateLower        = (state ?? "").toLowerCase().trim();
    const lagosAreas        = ["lagos"];
    const southwestStates   = ["ogun", "oyo", "osun", "ekiti", "ondo"];
    const southsouthStates  = ["rivers", "delta", "bayelsa", "edo", "cross river", "akwa ibom"];
    const southeastStates   = ["anambra", "imo", "enugu", "ebonyi", "abia"];
    const northStates       = [
      "kano", "kaduna", "katsina", "sokoto", "kebbi", "zamfara", "jigawa",
      "bauchi", "gombe", "yobe", "borno", "adamawa", "taraba", "plateau",
      "nasarawa", "benue", "kogi", "kwara", "niger", "fct", "abuja",
    ];

    const defaultCost = shipping.defaultShippingCost ?? 2500;
    let cost          = defaultCost;
    let label         = "Standard Delivery";
    let estimatedDays = "5-7";

    if (lagosAreas.some((s) => stateLower.includes(s))) {
      cost = Math.round(defaultCost * 0.6);
      label = "Lagos Delivery";
      estimatedDays = "1-2";
    } else if (southwestStates.some((s) => stateLower.includes(s))) {
      cost = Math.round(defaultCost * 0.8);
      label = "Southwest Delivery";
      estimatedDays = "2-4";
    } else if ([...southsouthStates, ...southeastStates].some((s) => stateLower.includes(s))) {
      cost = defaultCost;
      label = "South Delivery";
      estimatedDays = "3-5";
    } else if (northStates.some((s) => stateLower.includes(s))) {
      cost = Math.round(defaultCost * 1.4);
      label = "North Delivery";
      estimatedDays = "5-7";
    }

    return NextResponse.json({
      success: true,
      data: {
        cost,
        label,
        estimatedDays,
        isFree: false,
        freeDeliveryFrom: threshold,
        amountUntilFree: Math.max(0, threshold - orderTotal),
      },
    });
  } catch (error) {
    console.error("[POST /api/shipping/calculate]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false }, { status: 403 });
    }
    await connectDB();
    const settings = await (Settings as any).getSingleton();
    return NextResponse.json({ success: true, data: settings?.shipping ?? {} });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
