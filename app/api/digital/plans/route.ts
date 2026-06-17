/**
 * app/api/digital/plans/route.ts
 * GET /api/digital/plans?category=data&network=mtn
 *
 * Returns available plans with customer-facing prices (markup applied).
 * Categories: data | airtime | cable | education
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchDataPlans, CABLE_PLANS } from "@/services/vtu/gladtidings";
import { getDigitalConfig, applyMarkup, DigitalCategory } from "@/services/vtu/helpers";

// Airtime amounts (in NGN) — customers can buy any amount ₦50–₦50,000
const AIRTIME_AMOUNTS = [50, 100, 200, 500, 1000, 2000, 5000];

// Education catalog
const EDUCATION_PLANS = [
  { id: "waec_1",   examName: "WAEC",   name: "WAEC Result Checker",   costPrice: 900,  quantity: 1 },
  { id: "neco_1",   examName: "NECO",   name: "NECO Result Checker",   costPrice: 700,  quantity: 1 },
  { id: "nabteb_1", examName: "NABTEB", name: "NABTEB Result Checker", costPrice: 750,  quantity: 1 },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "data") as DigitalCategory;
    const network  = searchParams.get("network") || "";

    const config = await getDigitalConfig();

    // ── Check if service is enabled ──
    if (!config.services[category]) {
      return NextResponse.json({ success: false, error: `${category} service is currently unavailable` }, { status: 503 });
    }

    if (category === "data") {
      const allPlans = await fetchDataPlans();
      let plans = allPlans;
      if (network) plans = allPlans.filter(p => p.network === network.toLowerCase());

      const result = plans.map(p => ({
        id:          p.id,
        name:        p.name,
        validity:    p.validity,
        network:     p.network,
        planType:    p.planType,
        providerPlanId: p.providerPlanId,
        price:       applyMarkup(p.cost, "data", config),
        costPrice:   p.cost,
      }));

      // Sort by network then price
      result.sort((a, b) => a.network.localeCompare(b.network) || a.price - b.price);

      return NextResponse.json({ success: true, data: result, markup: config.markup.data });
    }

    if (category === "airtime") {
      const result = AIRTIME_AMOUNTS.map(amount => ({
        id:    `airtime_${amount}`,
        name:  `₦${amount.toLocaleString("en-NG")} Airtime`,
        price: applyMarkup(amount, "airtime", config),
        costPrice: amount,
      }));
      return NextResponse.json({ success: true, data: result, markup: config.markup.airtime });
    }

    if (category === "cable") {
      const result = Object.entries(CABLE_PLANS).map(([planId, plan]) => ({
        id:       `cable_${planId}`,
        planId:   Number(planId),
        name:     plan.name,
        provider: plan.provider,
        price:    applyMarkup(plan.price, "cable", config),
        costPrice:plan.price,
      }));
      // Group by provider
      result.sort((a, b) => a.provider.localeCompare(b.provider) || a.price - b.price);
      return NextResponse.json({ success: true, data: result, markup: config.markup.cable });
    }

    if (category === "education") {
      const result = EDUCATION_PLANS.map(p => ({
        ...p,
        price: applyMarkup(p.costPrice, "education", config),
      }));
      return NextResponse.json({ success: true, data: result, markup: config.markup.education });
    }

    return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
  } catch (error) {
    console.error("[GET /api/digital/plans]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
