import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });

    const order = await Order.findOne({ _id: orderId, user: session.user.id });
    if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    if (order.paymentStatus === "paid") return NextResponse.json({ success: false, error: "Order is already paid" }, { status: 409 });
    if (order.paymentMethod !== "flutterwave") return NextResponse.json({ success: false, error: "This order is not configured for Flutterwave" }, { status: 400 });

    const txRef = `MHE-${order.orderNumber}`;
    const response = await axios.post("https://api.flutterwave.com/v3/payments", {
      tx_ref: txRef, amount: order.total, currency: "NGN", payment_options: "card,banktransfer,ussd",
      customer: { email: session.user.email, name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`, phone: order.shippingAddress.phone.replace(/\D/g, "") },
      customizations: { title: "Mercy Home Essentials", description: `Payment for ${order.orderNumber}` },
      meta: { orderId: String(order._id), orderNumber: order.orderNumber },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/verify`,
    }, { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`, "Content-Type": "application/json" } });

    if (response.data?.status !== "success") return NextResponse.json({ success: false, error: "Payment initialization failed" }, { status: 502 });
    order.paymentReference = txRef;
    await order.save();
    return NextResponse.json({ success: true, data: { link: response.data.data.link, transaction_id: response.data.data.transaction_id, reference: txRef } });
  } catch (error: any) {
    console.error("[FLUTTERWAVE_INIT]", error.response?.data || error.message);
    return NextResponse.json({ success: false, error: error.response?.data?.message || "Server error occurred during payment initialization" }, { status: 500 });
  }
}
