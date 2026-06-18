/**
 * app/api/admin/digital/plans/route.ts
 * GET   /api/admin/digital/plans?category=data    — live plans with hidden/visible status
 * PATCH /api/admin/digital/plans                  — toggle a plan's visibility on the storefront
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalConfig }             from "@/lib/models/DigitalModels";
import { getDigitalConfig }          from "@/services/vtu/helpers";
import { fetchDataPlans, CABLE_PLANS } from "@/services/vtu/gladtidings";

const AIRTIME_AMOUNTS = [50, 100, 200, 500, 1000, 2000, 5000];

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "data";

    const config = await getDigitalConfig();
    const hidden = new Set(config.hiddenPlanIds || []);

    let plans: { id: string; label: string; meta: string; hidden: boolean }[] = [];

    if (category === "data") {
      const dataPlans = await fetchDataPlans();
      plans = dataPlans.map((p) => ({
        id: p.id, label: p.name, meta: `${p.network.toUpperCase()} · ${p.validity || ""}`,
        hidden: hidden.has(p.id) || hidden.has(p.providerPlanId),
      }));
    } else if (category === "airtime") {
      plans = AIRTIME_AMOUNTS.map((amount) => ({
        id: `airtime_${amount}`, label: `₦${amount.toLocaleString("en-NG")} Airtime`, meta: "All networks",
        hidden: hidden.has(`airtime_${amount}`),
      }));
    } else if (category === "cable") {
      plans = Object.entries(CABLE_PLANS).map(([planId, plan]) => ({
        id: `cable_${planId}`, label: plan.name, meta: plan.provider.toUpperCase(),
        hidden: hidden.has(`cable_${planId}`),
      }));
    } else {
      return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("[GET /api/admin/digital/plans]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { planId, hidden } = body as { planId: string; hidden: boolean };
    if (!planId) return NextResponse.json({ success: false, error: "planId is required" }, { status: 400 });

    if (hidden) {
      await DigitalConfig.findOneAndUpdate({ name: "default" }, { $addToSet: { hiddenPlanIds: planId } }, { upsert: true });
    } else {
      await DigitalConfig.findOneAndUpdate({ name: "default" }, { $pull: { hiddenPlanIds: planId } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/digital/plans]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
