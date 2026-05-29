import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { email, amount, orderId, reference } = await req.json();

    if (!email || !amount || !orderId || !reference) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100, // Paystack expects amount in kobo/cents
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/verify`,
        reference: reference,
        metadata: { orderId },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status) {
      return NextResponse.json({
        success: true,
        data: {
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          reference: response.data.data.reference,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Payment initialization failed" }, { status: 500 });
  } catch (error: any) {
    console.error("[PAYSTACK_INIT]", error.response?.data || error.message);
    return NextResponse.json({
      success: false,
      error: error.response?.data?.message || "Server error occurred during payment initialization",
    }, { status: 500 });
  }
}
