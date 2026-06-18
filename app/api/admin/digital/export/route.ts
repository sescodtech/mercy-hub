/**
 * app/api/admin/digital/export/route.ts
 * GET /api/admin/digital/export?status=&category=&search=
 * Admin: CSV export of digital orders (same filters as the transactions table)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalOrder }              from "@/lib/models/DigitalModels";

function csvEscape(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
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

    const orders = await DigitalOrder.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5000) // safety cap so a runaway export can't take the DB down
      .lean();

    const headers = ["Order Ref", "Date", "Category", "Plan", "Customer", "Email", "Phone", "Amount", "Cost", "Status", "Provider Ref", "Fail Reason"];
    const rows = orders.map((o) => [
      o.orderRef,
      new Date(o.createdAt).toISOString(),
      o.category,
      o.planName,
      (o.user as { name?: string } | undefined)?.name || "",
      (o.user as { email?: string } | undefined)?.email || "",
      o.phone || o.smartcard || "",
      o.amount,
      o.costPrice,
      o.status,
      o.providerRef || "",
      o.failReason || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="digital-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/digital/export]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
