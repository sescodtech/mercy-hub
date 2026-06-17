/**
 * app/api/digital/wallet/balance/route.ts
 * GET /api/digital/wallet/balance
 * Returns the authenticated user's digital wallet balance
 */

import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";
import { getWalletBalance, getWalletLedger } from "@/services/vtu/helpers";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const [balance, ledger] = await Promise.all([
      getWalletBalance(session.user.id as string),
      getWalletLedger(session.user.id as string, 10),
    ]);

    return NextResponse.json({ success: true, balance, recentLedger: ledger });
  } catch (error) {
    console.error("[GET /api/digital/wallet/balance]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
