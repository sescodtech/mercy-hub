import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
import Settings from "@/lib/models/Settings";
import { sendOrderConfirmationEmail, sendAdminOrderAlert } from "@/lib/email";
import { sendOrderConfirmation } from "@/services/whatsapp";

export async function GET(req: NextRequest) {
  try {
    const reference = req.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { success: false, error: "Payment reference is required" },
        { status: 400 }
      );
    }

    // ── 1. Verify with Paystack ──────────────────────────────
    const { data: paystackData } = await axios.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json(
        { success: false, error: `Payment was not successful. Status: ${paystackData.data?.status ?? "unknown"}` },
        { status: 400 }
      );
    }

    await connectDB();

    // ── 2. Find the order ────────────────────────────────────
    const orderId    = paystackData.data?.metadata?.orderId;
    const orderQuery = orderId ? { _id: orderId } : { orderNumber: reference };

    const order = await Order.findOne(orderQuery).populate("user", "name email");
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found for this payment reference." },
        { status: 404 }
      );
    }

    const alreadyPaid = order.paymentStatus === "paid";

    // ── 3. Mark paid + send notifications ───────────────────
    if (!alreadyPaid) {
      order.paymentStatus    = "paid";
      order.orderStatus      = "confirmed";
      order.paymentReference = reference;
      await order.save();

      // Load store settings to check which notifications are enabled
      const settings = await (Settings as any).getSingleton();

      const storeUrl          = settings?.website || process.env.NEXT_PUBLIC_APP_URL || "";
      const emailEnabled      = settings?.notifications?.orderEmail  ?? true;
      const whatsappEnabled   = settings?.notifications?.orderWhatsapp ?? false; // OFF by default
      const adminEmail        = settings?.notifications?.adminEmail  || process.env.SMTP_USER || "";
      const adminPhone        = settings?.notifications?.adminPhone  || "";

      const customerName  = order.shippingAddress.firstName + " " + order.shippingAddress.lastName;
      const customerPhone = order.shippingAddress.phone;
      const customerEmail = (order.user as any)?.email ?? paystackData.data?.customer?.email ?? "";

      const items = order.items.map((item: any) => ({
        name:     item.product?.name ?? "Product",
        quantity: item.quantity,
        price:    item.price,
      }));

      // ── Customer email (controlled by settings.notifications.orderEmail) ──
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
        }).catch((err) => console.error("[VERIFY] Customer email failed:", err));
      }

      // ── Customer WhatsApp (controlled by settings.notifications.orderWhatsapp) ──
      // Default is OFF. Admin enables this from Settings → Payments → Notifications
      if (whatsappEnabled && customerPhone) {
        sendOrderConfirmation({
          customerName,
          customerPhone,
          orderNumber: order.orderNumber,
          total:       order.total,
          items,
        }).catch((err) => console.error("[VERIFY] Customer WhatsApp failed:", err));
      }

      // ── Admin email alert (always fires if adminEmail is set) ──
      if (adminEmail) {
        sendAdminOrderAlert({
          orderNumber:     order.orderNumber,
          customerName,
          total:           order.total,
          items,
          shippingAddress: order.shippingAddress,
        }).catch((err) => console.error("[VERIFY] Admin email failed:", err));
      }

      // ── Admin WhatsApp alert (only if whatsapp enabled + adminPhone set) ──
      // Uses the same whatsappEnabled toggle — admin gets WA alerts when customer WA is on
      if (whatsappEnabled && adminPhone) {
        sendOrderConfirmation({
          customerName:  "Admin",
          customerPhone: adminPhone,
          orderNumber:   order.orderNumber,
          total:         order.total,
          items,
        }).catch((err) => console.error("[VERIFY] Admin WhatsApp failed:", err));
      }
    }

    // ── 4. Respond ───────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        total:       order.total,
        status:      order.orderStatus,
        paymentRef:  reference,
      },
    });
  } catch (error: any) {
    console.error("[PAYSTACK_VERIFY]", error.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: error.response?.data?.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
