import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
import Settings from "@/lib/models/Settings";
import { sendOrderConfirmationEmail, sendAdminOrderAlert } from "@/lib/email";
import { sendOrderConfirmation } from "@/services/whatsapp";
import { DigitalDeposit } from "@/lib/models/DigitalModels";
import { creditWallet }   from "@/services/vtu/helpers";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  // ── Verify webhook signature ─────────────────────────────
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

  if (webhookSecret) {
    const hash = crypto
      .createHmac("sha512", webhookSecret)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("[PAYSTACK_WEBHOOK] Invalid signature — rejecting");
      return new NextResponse("Unauthorized", { status: 401 });
    }
  } else {
    console.warn("[PAYSTACK_WEBHOOK] PAYSTACK_WEBHOOK_SECRET not set. Skipping signature check.");
  }

  const event = JSON.parse(body);
  console.log("[PAYSTACK_WEBHOOK] Event received:", event.event);

  // Only process successful payments
  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  // ── Wallet top-up deposit ────────────────────────────────
  if (event.data?.metadata?.purpose === "wallet_deposit") {
    const reference = event.data.reference;
    const userId    = event.data.metadata?.userId;
    const amount    = event.data.amount / 100;
    if (reference && userId) {
      await connectDB();
      const deposit = await DigitalDeposit.findOne({ reference });
      if (deposit && deposit.status === "pending") {
        await Promise.all([
          creditWallet(userId, amount, "Wallet top-up via Paystack", reference),
          DigitalDeposit.findOneAndUpdate({ reference }, { status: "verified" }),
        ]);
        console.log(`[PAYSTACK_WEBHOOK] Wallet credited: user=${userId} amount=₦${amount}`);
      }
    }
    return NextResponse.json({ received: true });
  }
  // ─────────────────────────────────────────────────────────

  const data      = event.data;
  const reference = data.reference;
  const orderId   = data.metadata?.orderId;

  try {
    await connectDB();

    // ── Find the order ───────────────────────────────────────
    const order = await Order.findOne(
      orderId ? { _id: orderId } : { orderNumber: reference }
    ).populate("user", "name email phone");

    if (!order) {
      console.error("[PAYSTACK_WEBHOOK] Order not found for reference:", reference);
      return NextResponse.json({ received: true });
    }

    // ── Idempotency — skip if already paid ──────────────────
    if (order.paymentStatus === "paid") {
      console.log("[PAYSTACK_WEBHOOK] Already paid, skipping:", order.orderNumber);
      return NextResponse.json({ received: true });
    }

    // ── Mark as paid ─────────────────────────────────────────
    order.paymentStatus    = "paid";
    order.orderStatus      = "confirmed";
    order.paymentReference = reference;
    await order.save();

    console.log("[PAYSTACK_WEBHOOK] Order confirmed:", order.orderNumber);

    // ── Load settings for notification preferences ───────────
    const settings = await (Settings as any).getSingleton();

    const storeUrl        = settings?.website || process.env.NEXT_PUBLIC_APP_URL || "";
    const emailEnabled    = settings?.notifications?.orderEmail    ?? true;
    const whatsappEnabled = settings?.notifications?.orderWhatsapp ?? false;
    const adminEmail      = settings?.notifications?.adminEmail    || process.env.SMTP_USER || "";
    const adminPhone      = settings?.notifications?.adminPhone    || "";

    const customerName  = order.shippingAddress.firstName + " " + order.shippingAddress.lastName;
    const customerPhone = order.shippingAddress.phone;
    const customerEmail = (order.user as any)?.email ?? data.customer?.email ?? "";

    const items = order.items.map((item: any) => ({
      name:     item.product?.name ?? "Product",
      quantity: item.quantity,
      price:    item.price,
    }));

    // ── Customer email ───────────────────────────────────────
    if (emailEnabled && customerEmail) {
      sendOrderConfirmationEmail({
        customerName,
        customerEmail,
        orderNumber:     order.orderNumber,
        total:           order.total,
        items,
        shippingAddress: order.shippingAddress,
        shippingCost:    order.shippingCost,
        discount:        order.discount,
        storeUrl,
      }).catch((err) => console.error("[WEBHOOK] Customer email failed:", err));
    }

    // ── Customer WhatsApp ────────────────────────────────────
    if (whatsappEnabled && customerPhone) {
      sendOrderConfirmation({
        customerName,
        customerPhone,
        orderNumber: order.orderNumber,
        total:       order.total,
        items,
      }).catch((err) => console.error("[WEBHOOK] Customer WhatsApp failed:", err));
    }

    // ── Admin email alert ────────────────────────────────────
    if (adminEmail) {
      sendAdminOrderAlert({
        orderNumber:     order.orderNumber,
        customerName,
        total:           order.total,
        items,
        shippingAddress: order.shippingAddress,
      }).catch((err) => console.error("[WEBHOOK] Admin email failed:", err));
    }

    // ── Admin WhatsApp alert ─────────────────────────────────
    if (whatsappEnabled && adminPhone) {
      sendOrderConfirmation({
        customerName:  "Admin",
        customerPhone: adminPhone,
        orderNumber:   order.orderNumber,
        total:         order.total,
        items,
      }).catch((err) => console.error("[WEBHOOK] Admin WhatsApp failed:", err));
    }

  } catch (err) {
    console.error("[PAYSTACK_WEBHOOK] Error processing:", err);
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
