/**
 * app/api/admin/digital/wallets/[userId]/route.ts
 * GET  /api/admin/digital/wallets/:userId   — wallet balance + recent ledger entries
 * POST /api/admin/digital/wallets/:userId   — manual credit/debit adjustment (support/refunds)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalWallet }             from "@/lib/models/DigitalModels";
import { User }                      from "@/lib/models";
import { creditWallet, debitWallet, getWalletLedger } from "@/services/vtu/helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    await connectDB();

    const [wallet, user, ledger] = await Promise.all([
      DigitalWallet.findOne({ user: userId }).lean(),
      User.findById(userId).select("name email phone").lean(),
      getWalletLedger(userId, 50),
    ]);

    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    return NextResponse.json({
      success: true,
      data: { user, balance: wallet?.balance ?? 0, ledger },
    });
  } catch (error) {
    console.error("[GET /api/admin/digital/wallets/:userId]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await params;
    await connectDB();
    const body = await req.json();
    const { action, amount, note } = body as { action: "credit" | "debit"; amount: number; note?: string };

    if (!action || !["credit", "debit"].includes(action)) {
      return NextResponse.json({ success: false, error: "action must be 'credit' or 'debit'" }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "amount must be greater than 0" }, { status: 400 });
    }

    const adminName = (session.user as { name?: string }).name || "Admin";
    const reason = `${note ? note + " — " : ""}Manual adjustment by ${adminName}`;

    if (action === "credit") {
      await creditWallet(userId, amount, reason);
    } else {
      const ok = await debitWallet(userId, amount, reason);
      if (!ok) {
        return NextResponse.json({ success: false, error: "Insufficient wallet balance for this debit" }, { status: 400 });
      }
    }

    const wallet = await DigitalWallet.findOne({ user: userId }).lean();
    return NextResponse.json({ success: true, balance: wallet?.balance ?? 0 });
  } catch (error) {
    console.error("[POST /api/admin/digital/wallets/:userId]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
