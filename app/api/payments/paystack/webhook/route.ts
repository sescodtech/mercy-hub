import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { Order, User } from "@/lib/models";
import { sendOrderConfirmationEmail, sendAdminOrderAlert } from "@/lib/email";
import { sendOrderConfirmation } from "@/services/whatsapp";

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  // ── Verify webhook signature — MUST pass before anything else ──
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET ?? "")
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    console.error("[PAYSTACK_WEBHOOK] Invalid signature");
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const event = JSON.parse(body);
  console.log("[PAYSTACK_WEBHOOK] Event:", event.event);

  // ── Only handle successful charge events ──
  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const data      = event.data;
  const reference = data.reference;
  const orderId   = data.metadata?.orderId;

  try {
    await connectDB();

    // Find order — try by orderId metadata first, then by orderNumber
    const order = await Order.findOne(
      orderId ? { _id: orderId } : { orderNumber: reference }
    ).populate("user", "name email phone");

    if (!order) {
      console.error("[PAYSTACK_WEBHOOK] Order not found for reference:", reference);
      return NextResponse.json({ received: true });
    }

    // Skip if already processed (idempotency)
    if (order.paymentStatus === "paid") {
      console.log("[PAYSTACK_WEBHOOK] Order already paid, skipping:", order.orderNumber);
      return NextResponse.json({ received: true });
    }

    // ── Update order to paid + confirmed ──
    order.paymentStatus    = "paid";
    order.orderStatus      = "confirmed";
    order.paymentReference = reference;
    await order.save();

    console.log("[PAYSTACK_WEBHOOK] Order confirmed:", order.orderNumber);

    const storeUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const customerName  = order.shippingAddress.firstName + " " + order.shippingAddress.lastName;
    const customerPhone = order.shippingAddress.phone;
    const customerEmail = (order.user as any)?.email ?? data.customer?.email ?? "";

    const items = order.items.map((item: any) => ({
      name:     item.product?.name ?? "Product",
      quantity: item.quantity,
      price:    item.price,
    }));

    // ── 1. Send customer order confirmation EMAIL ──
    if (customerEmail) {
      await sendOrderConfirmationEmail({
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

    // ── 2. Send customer WhatsApp confirmation ──
    if (customerPhone) {
      await sendOrderConfirmation({
        customerName,
        customerPhone,
        orderNumber: order.orderNumber,
        total:       order.total,
        items,
      }).catch((err) => console.error("[WEBHOOK] Customer WhatsApp failed:", err));
    }

    // ── 3. Send admin order alert EMAIL ──
    await sendAdminOrderAlert({
      orderNumber:     order.orderNumber,
      customerName,
      total:           order.total,
      items,
      shippingAddress: order.shippingAddress,
    }).catch((err) => console.error("[WEBHOOK] Admin email failed:", err));

  } catch (err) {
    console.error("[PAYSTACK_WEBHOOK] Error processing:", err);
    // Still return 200 so Paystack doesn't retry indefinitely
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
