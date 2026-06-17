/**
 * app/api/admin/digital/transactions/route.ts
 * GET /api/admin/digital/transactions?page=1&status=failed&category=data
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalOrder }              from "@/lib/models/DigitalModels";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, Number(searchParams.get("page")     || 1));
    const limit    = Math.min(100, Number(searchParams.get("limit")  || 20));
    const status   = searchParams.get("status");
    const category = searchParams.get("category");
    const search   = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (status)   query.status   = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { orderRef: { $regex: search, $options: "i" } },
        { phone:    { $regex: search, $options: "i" } },
        { planName: { $regex: search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      DigitalOrder.find(query)
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DigitalOrder.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/digital/transactions]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
