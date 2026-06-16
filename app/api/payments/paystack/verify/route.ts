import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
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

    // Verify with Paystack
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

    // Update if not already paid
    if (!alreadyPaid) {
      order.paymentStatus    = "paid";
      order.orderStatus      = "confirmed";
      order.paymentReference = reference;
      await order.save();

      // Fire notifications (webhook may have already done this, but this is the backup)
      const storeUrl      = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const customerName  = order.shippingAddress.firstName + " " + order.shippingAddress.lastName;
      const customerPhone = order.shippingAddress.phone;
      const customerEmail = (order.user as any)?.email ?? paystackData.data?.customer?.email ?? "";

      const items = order.items.map((item: any) => ({
        name:     item.product?.name ?? "Product",
        quantity: item.quantity,
        price:    item.price,
      }));

      // Customer email
      if (customerEmail) {
        await sendOrderConfirmationEmail({
          customerName, customerEmail,
          orderNumber:     order.orderNumber,
          total:           order.total,
          items,
          shippingAddress: order.shippingAddress,
          shippingCost:    order.shippingCost,
          discount:        order.discount,
          storeUrl,
        }).catch(() => {});
      }

      // Customer WhatsApp
      if (customerPhone) {
        await sendOrderConfirmation({
          customerName, customerPhone,
          orderNumber: order.orderNumber,
          total:       order.total,
          items,
        }).catch(() => {});
      }

      // Admin email
      await sendAdminOrderAlert({
        orderNumber:     order.orderNumber,
        customerName,
        total:           order.total,
        items,
        shippingAddress: order.shippingAddress,
      }).catch(() => {});
    }

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
