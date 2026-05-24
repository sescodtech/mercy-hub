import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendOrderConfirmation, sendOrderStatusUpdate } from "@/services/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, data } = body;

    let result = false;

    if (type === "order_confirmation") {
      result = await sendOrderConfirmation(data);
    } else if (type === "order_status") {
      result = await sendOrderStatusUpdate(data);
    } else {
      return NextResponse.json({ success: false, error: "Invalid notification type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      sent: result,
      message: result ? "WhatsApp notification sent" : "WhatsApp not configured — message logged",
    });
  } catch (error) {
    console.error("[POST /api/whatsapp]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
