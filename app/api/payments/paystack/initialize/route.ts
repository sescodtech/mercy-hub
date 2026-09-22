import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });

    const order = await Order.findOne({ _id: orderId, user: session.user.id });
    if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    if (order.paymentStatus === "paid") return NextResponse.json({ success: false, error: "Order is already paid" }, { status: 409 });
    if (order.paymentMethod !== "paystack") return NextResponse.json({ success: false, error: "This order is not configured for Paystack" }, { status: 400 });
    if (!Number.isFinite(order.total) || order.total <= 0) return NextResponse.json({ success: false, error: "Invalid order total" }, { status: 400 });

    const reference = order.paymentReference || order.orderNumber;
    const response = await axios.post("https://api.paystack.co/transaction/initialize", {
      email: session.user.email,
      amount: Math.round(order.total * 100),
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/verify`,
      reference,
      metadata: { orderId: String(order._id), orderNumber: order.orderNumber },
    }, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" } });

    if (!response.data?.status) return NextResponse.json({ success: false, error: "Payment initialization failed" }, { status: 502 });
    order.paymentReference = response.data.data.reference;
    await order.save();

    return NextResponse.json({ success: true, data: { authorization_url: response.data.data.authorization_url, access_code: response.data.data.access_code, reference: response.data.data.reference } });
  } catch (error: any) {
    console.error("[PAYSTACK_INIT]", error.response?.data || error.message);
    return NextResponse.json({ success: false, error: error.response?.data?.message || "Server error occurred during payment initialization" }, { status: 500 });
  }
}
