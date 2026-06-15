import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";

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
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment was not successful. Status: ${paystackData.data?.status ?? "unknown"}`,
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the order by orderNumber (reference) or metadata orderId
    const orderId    = paystackData.data?.metadata?.orderId;
    const orderQuery = orderId
      ? { _id: orderId }
      : { orderNumber: reference };

    const order = await Order.findOne(orderQuery);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found for this payment reference." },
        { status: 404 }
      );
    }

    // Update order payment status if not already paid
    if (order.paymentStatus !== "paid") {
      order.paymentStatus    = "paid";
      order.orderStatus      = "confirmed";
      order.paymentReference = reference;
      await order.save();
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
      {
        success: false,
        error: error.response?.data?.message || "Payment verification failed",
      },
      { status: 500 }
    );
  }
}
