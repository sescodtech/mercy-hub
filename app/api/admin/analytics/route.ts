import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, Product, User } from "@/lib/models";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30"; // days
    const days = parseInt(range);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ─── Overview Stats ───────────────────────────────────
    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      revenueData,
      previousRevenueData,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ role: "user", createdAt: { $gte: startDate } }),
      Product.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: startDate } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      // Previous period for growth calculation
      Order.aggregate([
        {
          $match: {
            paymentStatus: "paid",
            createdAt: {
              $gte: new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000),
              $lt: startDate,
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = revenueData[0]?.total || 0;
    const prevRevenue = previousRevenueData[0]?.total || 0;
    const revenueGrowth = prevRevenue > 0
      ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
      : "0";

    // ─── Revenue Over Time ────────────────────────────────
    const revenueOverTime = await Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year:  { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day:   { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year: "$_id.year", month: "$_id.month", day: "$_id.day",
                },
              },
            },
          },
          revenue: 1,
          orders: 1,
        },
      },
    ]);

    // ─── Top Selling Products ─────────────────────────────
    const topProducts = await Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold:    { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          name:         "$product.name",
          image:        { $arrayElemAt: ["$product.images.url", 0] },
          totalSold:    1,
          totalRevenue: 1,
        },
      },
    ]);

    // ─── Category Performance ─────────────────────────────
    const categoryPerformance = await Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startDate } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $group: {
          _id:     "$category.name",
          revenue: { $sum: "$items.total" },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // ─── Recent Orders ────────────────────────────────────
    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // ─── Order Status Breakdown ───────────────────────────
    const orderStatusBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    // ─── Low Stock Products ───────────────────────────────
    const lowStockProducts = await Product.find({
      trackInventory: true,
      isActive: true,
      $expr: { $lte: ["$stock", "$lowStockThreshold"] },
    })
      .select("name stock lowStockThreshold images")
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts,
          revenueGrowth: parseFloat(revenueGrowth as string),
          avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        },
        revenueOverTime,
        topProducts,
        categoryPerformance,
        recentOrders,
        orderStatusBreakdown,
        lowStockProducts,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/analytics]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
