/**
 * app/api/admin/digital/diagnostics/route.ts
 * GET /api/admin/digital/diagnostics
 * Admin: live provider health check + recent failed-order error log
 */

import { NextResponse }       from "next/server";
import { auth }               from "@/lib/auth";
import { connectDB }          from "@/lib/db";
import { DigitalOrder }       from "@/lib/models/DigitalModels";
import { getProviderBalance } from "@/services/vtu/gladtidings";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const start = Date.now();
    const balanceCheck = await getProviderBalance();
    const latencyMs = Date.now() - start;

    const recentErrors = await DigitalOrder.find({ status: "failed" })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("orderRef category planName failReason retryCount createdAt")
      .lean();

    return NextResponse.json({
      success: true,
      provider: {
        name: "GladTidings",
        connected: balanceCheck.success,
        balance: balanceCheck.balance ?? null,
        error: balanceCheck.success ? null : (balanceCheck.error || "Unable to reach provider"),
        latencyMs,
        checkedAt: new Date().toISOString(),
      },
      recentErrors,
    });
  } catch (error) {
    console.error("[GET /api/admin/digital/diagnostics]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
