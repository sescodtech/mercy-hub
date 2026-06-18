/**
 * app/api/digital/promos/route.ts
 * GET /api/digital/promos?type=deal           -> active Hot Deals
 * GET /api/digital/promos?type=promo          -> active Promo Products
 * GET /api/digital/promos                     -> all active promos (both types)
 *
 * Public, read-only. Admin management (create/edit/delete) lives under
 * /api/admin/digital/promos.
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB }                 from "@/lib/db";
import { DigitalPromo }              from "@/lib/models/DigitalModels";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "deal" | "promo" | null

    const query: Record<string, unknown> = {
      isActive: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gte: new Date() } }],
    };
    if (type === "deal" || type === "promo") query.type = type;

    const promos = await DigitalPromo.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: promos });
  } catch (error) {
    console.error("[GET /api/digital/promos]", error);
    return NextResponse.json({ success: false, error: "Server error", data: [] }, { status: 500 });
  }
}
