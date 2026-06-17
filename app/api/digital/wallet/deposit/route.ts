/**
 * app/api/digital/wallet/deposit/route.ts
 * POST /api/digital/wallet/deposit
 * Initiates a Paystack payment to top up the user's digital wallet.
 * On successful payment, the Paystack webhook credits the wallet.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalDeposit }            from "@/lib/models/DigitalModels";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await req.json();
    if (!amount || Number(amount) < 100) {
      return NextResponse.json({ success: false, error: "Minimum deposit is ₦100" }, { status: 400 });
    }

    await connectDB();

    const reference = `MH-WALLET-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Record pending deposit
    await DigitalDeposit.create({
      user:      session.user.id,
      reference,
      amount:    Number(amount),
      status:    "pending",
    });

    // Initialize Paystack transaction
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email:     session.user.email,
        amount:    Number(amount) * 100, // kobo
        reference,
        metadata: {
          purpose: "wallet_deposit",
          userId:  session.user.id,
        },
        callback_url: `${process.env.NEXTAUTH_URL}/digital/wallet?funded=1`,
      }),
    });

    const data = await paystackRes.json();

    if (!data.status) {
      return NextResponse.json({ success: false, error: "Failed to initialize payment" }, { status: 500 });
    }

    return NextResponse.json({
      success:        true,
      authorizationUrl: data.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error("[POST /api/digital/wallet/deposit]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
