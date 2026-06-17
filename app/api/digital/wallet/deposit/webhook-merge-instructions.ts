/**
 * MERGE THIS INTO: app/api/payments/paystack/webhook/route.ts
 *
 * Add this block inside your existing webhook handler, after the charge.success
 * handler you already have for orders. It detects wallet deposit events and
 * credits the user's digital wallet.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INSTRUCTIONS:
 * In your existing webhook route.ts, find the section that handles
 * event.event === "charge.success" and add this check BEFORE the order logic:
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Add these imports to the top of your webhook route.ts ───
// import { DigitalDeposit } from "@/lib/models/DigitalModels";
// import { creditWallet }   from "@/services/vtu/helpers";

// ─── Add this block inside your charge.success handler ───────
/*

  // ── Wallet deposit ──
  if (event.data?.metadata?.purpose === "wallet_deposit") {
    const reference = event.data.reference;
    const userId    = event.data.metadata?.userId;
    const amount    = event.data.amount / 100; // convert from kobo

    if (reference && userId) {
      await connectDB();
      const deposit = await DigitalDeposit.findOne({ reference });

      if (deposit && deposit.status === "pending") {
        await Promise.all([
          creditWallet(userId, amount, "Wallet top-up via Paystack", reference),
          DigitalDeposit.findOneAndUpdate({ reference }, { status: "verified" }),
        ]);
        console.log(`[Webhook] Wallet credited: user=${userId} amount=₦${amount}`);
      }
    }

    return NextResponse.json({ received: true });
  }

*/

// ─── Full example of what your webhook handler might look like ────────────────
import { NextRequest, NextResponse } from "next/server";
import crypto                         from "crypto";
import { connectDB }                  from "@/lib/db";
import { Order }                      from "@/lib/models";
import { DigitalDeposit }             from "@/lib/models/DigitalModels";
import { creditWallet }               from "@/services/vtu/helpers";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET ?? process.env.PAYSTACK_SECRET_KEY ?? "")
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  await connectDB();

  if (event.event === "charge.success") {

    // ── 1. Wallet deposit ────────────────────────────────────────
    if (event.data?.metadata?.purpose === "wallet_deposit") {
      const reference = event.data.reference;
      const userId    = event.data.metadata?.userId;
      const amount    = event.data.amount / 100;

      if (reference && userId) {
        const deposit = await DigitalDeposit.findOne({ reference });
        if (deposit && deposit.status === "pending") {
          await Promise.all([
            creditWallet(userId, amount, "Wallet top-up via Paystack", reference),
            DigitalDeposit.findOneAndUpdate({ reference }, { status: "verified" }),
          ]);
        }
      }
      return NextResponse.json({ received: true });
    }

    // ── 2. Regular order payment ─────────────────────────────────
    const reference = event.data.reference;
    if (reference) {
      const order = await Order.findOne({ paymentReference: reference });
      if (order && order.paymentStatus !== "paid") {
        await Order.findByIdAndUpdate(order._id, {
          paymentStatus: "paid",
          orderStatus:   "confirmed",
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
