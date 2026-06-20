/**
 * app/api/digital/promos/route.ts
 * GET /api/digital/promos?type=deal   -> active Hot Deals
 * GET /api/digital/promos?type=promo  -> active Promo Products
 * GET /api/digital/promos             -> all active promos (both types)
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
    const type    = searchParams.get("type");    // "deal" | "promo" | null
    const network = searchParams.get("network"); // "mtn" | "airtel" | "glo" | "9mobile" | null

    const now = new Date();

    /**
     * FIX: The original query only matched documents where `expiresAt` was
     * absent from the DB record (`$exists: false`).  When the field is stored
     * explicitly as `null` (e.g. admin panel POSTed an empty date string that
     * bypassed the `|| undefined` guard), `$exists: false` does NOT match it,
     * causing valid, active promos to be invisible on the storefront.
     *
     * The corrected `$or` covers all three safe states:
     *  • field completely absent from the document
     *  • field is null
     *  • field is a Date in the future
     */
    const query: Record<string, unknown> = {
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: now } },
      ],
    };

    if (type === "deal" || type === "promo") {
      query.type = type;
    }

    // Network isolation: when a network is passed (MTN/Airtel/Glo/9mobile tab),
    // only return that network's own promos. Cable/education promos have no
    // network field and are routed through other tabs, so they're excluded
    // automatically here — this filter is only ever applied from data/airtime
    // network tabs in the first place.
    if (network) {
      query.network = network;
    }

    const promos = await DigitalPromo.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data:    promos,
      count:   promos.length,
    });
  } catch (error) {
    console.error("[GET /api/digital/promos]", error);
    return NextResponse.json(
      { success: false, error: "Server error", data: [] },
      { status: 500 }
    );
  }
}
