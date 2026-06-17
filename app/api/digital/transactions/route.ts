/**
 * app/api/digital/transactions/route.ts
 * GET /api/digital/transactions?page=1&limit=10&category=data
 * Returns the authenticated user's digital order history
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalOrder }              from "@/lib/models/DigitalModels";
import mongoose                      from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, Number(searchParams.get("page")  || 1));
    const limit    = Math.min(50, Number(searchParams.get("limit") || 10));
    const category = searchParams.get("category");

    const query: Record<string, unknown> = {
      user: new mongoose.Types.ObjectId(session.user.id as string),
    };
    if (category) query.category = category;

    const [orders, total] = await Promise.all([
      DigitalOrder.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-costPrice")   // don't expose our cost price to customers
        .lean(),
      DigitalOrder.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data:    orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/digital/transactions]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
