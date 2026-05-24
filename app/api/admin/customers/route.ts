import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Order } from "@/lib/models";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page   = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit  = Math.min(50, Number(searchParams.get("limit") ?? 20));
    const search = searchParams.get("search") ?? "";
    const skip   = (page - 1) * limit;

    const query: Record<string, unknown> = { role: "user" };
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    // Aggregate order stats for each user
    const userIds = users.map((u) => u._id);
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id:        "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$total", 0] } },
          lastOrder:  { $max: "$createdAt" },
        },
      },
    ]);

    const statsMap = orderStats.reduce<Record<string, { orderCount: number; totalSpent: number; lastOrder: Date }>>((acc, s) => {
      acc[s._id.toString()] = {
        orderCount: s.orderCount,
        totalSpent: s.totalSpent,
        lastOrder:  s.lastOrder,
      };
      return acc;
    }, {});

    const customers = users.map((u) => ({
      _id:        u._id,
      name:       u.name,
      email:      u.email,
      phone:      u.phone,
      createdAt:  u.createdAt,
      isVerified: u.isVerified,
      ...( statsMap[u._id.toString()] ?? { orderCount: 0, totalSpent: 0, lastOrder: null }),
    }));

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/customers]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
