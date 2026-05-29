import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { email, amount, orderId, name, phone } = await req.json();

    if (!email || !amount || !orderId || !name || !phone) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: `MHE-${orderId}-${Date.now()}`,
        amount: amount,
        currency: "NGN",
        payment_options: "card",
        customer: {
          email,
          name,
          phone: phone.replace(/\\+/, ""),
        },
        customizations: {
          title: "Mercy Home Essentials",
          description: "Payment for order",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "success") {
      return NextResponse.json({
        success: true,
        data: {
          link: response.data.data.link,
          transaction_id: response.data.data.transaction_id,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Payment initialization failed" }, { status: 500 });
  } catch (error: any) {
    console.error("[FLUTTERWAVE_INIT]", error.response?.data || error.message);
    return NextResponse.json({
      success: false,
      error: error.response?.data?.message || "Server error occurred during payment initialization",
    }, { status: 500 });
  }
}
