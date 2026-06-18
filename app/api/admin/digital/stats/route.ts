/**
 * app/api/admin/digital/stats/route.ts
 * GET /api/admin/digital/stats
 * Admin: summary stats for the digital services dashboard
 */

import { NextResponse }  from "next/server";
import { auth }          from "@/lib/auth";
import { connectDB }     from "@/lib/db";
import { DigitalOrder, DigitalWallet }  from "@/lib/models/DigitalModels";
import { getProviderBalance } from "@/services/vtu/gladtidings";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const [
      totalOrders,
      fulfilledOrders,
      failedOrders,
      todayOrders,
      revenue,
      providerBalance,
      distinctCustomers,
      platformWalletAgg,
      failureBreakdown,
      categoryBreakdown,
    ] = await Promise.all([
      DigitalOrder.countDocuments(),
      DigitalOrder.countDocuments({ status: "fulfilled" }),
      DigitalOrder.countDocuments({ status: "failed" }),
      DigitalOrder.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      DigitalOrder.aggregate([
        { $match: { status: "fulfilled" } },
        { $group: { _id: null, total: { $sum: "$amount" }, cost: { $sum: "$costPrice" } } },
      ]),
      getProviderBalance(),
      DigitalOrder.distinct("user"),
      DigitalWallet.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]),
      DigitalOrder.aggregate([
        { $match: { status: "failed", failReason: { $exists: true, $ne: null } } },
        { $group: { _id: "$failReason", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      DigitalOrder.aggregate([
        { $match: { status: "fulfilled" } },
        { $group: { _id: "$category", orders: { $sum: 1 }, revenue: { $sum: "$amount" }, cost: { $sum: "$costPrice" } } },
      ]),
    ]);

    const revenueData  = revenue[0] || { total: 0, cost: 0 };
    const grossProfit  = revenueData.total - revenueData.cost;

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        fulfilledOrders,
        failedOrders,
        todayOrders,
        totalRevenue:   revenueData.total,
        totalCost:      revenueData.cost,
        grossProfit,
        providerBalance:    providerBalance.balance ?? 0,
        providerConnected:  providerBalance.success,
        customerCount:      distinctCustomers.length,
        platformWalletTotal: platformWalletAgg[0]?.total || 0,
        failureBreakdown: failureBreakdown.map((f: { _id: string; count: number }) => ({ reason: f._id, count: f.count })),
        categoryBreakdown: categoryBreakdown.map((c: { _id: string; orders: number; revenue: number; cost: number }) => ({
          category: c._id, orders: c.orders, revenue: c.revenue, profit: c.revenue - c.cost,
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/digital/stats]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
