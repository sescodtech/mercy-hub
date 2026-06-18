/**
 * app/api/admin/digital/wallets/route.ts
 * GET /api/admin/digital/wallets?search=&page=1
 * Admin: list customer digital wallets, joined with user name/email
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalWallet }             from "@/lib/models/DigitalModels";
import { User }                      from "@/lib/models";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, Number(searchParams.get("page")  || 1));
    const limit  = Math.min(100, Number(searchParams.get("limit") || 20));
    const search = searchParams.get("search");

    let userIds: string[] | null = null;
    if (search) {
      const matches = await User.find({
        $or: [
          { name:  { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id").lean();
      userIds = matches.map((u) => String(u._id));
      if (userIds.length === 0) {
        return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, pages: 0 } });
      }
    }

    const query: Record<string, unknown> = {};
    if (userIds) query.user = { $in: userIds };

    const [wallets, total] = await Promise.all([
      DigitalWallet.find(query)
        .populate("user", "name email phone")
        .sort({ balance: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      DigitalWallet.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: wallets.map((w) => ({
        _id: w._id, user: w.user, balance: w.balance, updatedAt: w.updatedAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/digital/wallets]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
