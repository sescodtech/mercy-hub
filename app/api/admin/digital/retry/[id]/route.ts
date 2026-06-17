/**
 * app/api/admin/digital/retry/[id]/route.ts
 * POST /api/admin/digital/retry/:orderId
 * Admin: retry a failed digital order
 */

import { NextRequest, NextResponse }                        from "next/server";
import { auth }                                             from "@/lib/auth";
import { connectDB }                                        from "@/lib/db";
import { DigitalOrder }                                     from "@/lib/models/DigitalModels";
import { buyData, buyAirtime, buyCable, buyExamPin }        from "@/services/vtu/gladtidings";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const order = await DigitalOrder.findById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    if (order.status === "fulfilled") {
      return NextResponse.json({ success: false, error: "Order already fulfilled" }, { status: 400 });
    }
    if (order.retryCount >= 3) {
      return NextResponse.json({ success: false, error: "Max retry attempts reached (3)" }, { status: 400 });
    }

    await DigitalOrder.findByIdAndUpdate(order._id, {
      $inc: { retryCount: 1 },
      status: "processing",
    });

    let result;
    if (order.category === "data") {
      result = await buyData({
        planId:  order.planId!,
        phone:   order.phone!,
        network: order.network!,
        ref:     order.orderRef,
      });
    } else if (order.category === "airtime") {
      result = await buyAirtime({
        network: order.network!,
        phone:   order.phone!,
        amount:  order.costPrice,
      });
    } else if (order.category === "cable") {
      result = await buyCable({
        provider:  order.planName.split("(")[1]?.replace(")", "").toLowerCase() || "",
        smartcard: order.smartcard!,
        planId:    Number(order.planId),
        phone:     order.phone || "",
      });
    } else if (order.category === "education") {
      result = await buyExamPin({ examName: order.examName!, quantity: order.quantity });
    }

    if (result?.success) {
      await DigitalOrder.findByIdAndUpdate(order._id, {
        status:      "fulfilled",
        providerRef: String(result.reference || ""),
        failReason:  undefined,
        ...(result.pins ? { pins: result.pins } : {}),
      });
      return NextResponse.json({ success: true, message: "Order fulfilled successfully" });
    } else {
      await DigitalOrder.findByIdAndUpdate(order._id, {
        status:     "failed",
        failReason: result?.error || "Provider dispatch failed",
      });
      return NextResponse.json({ success: false, error: result?.error || "Retry failed" }, { status: 502 });
    }
  } catch (error) {
    console.error("[POST /api/admin/digital/retry]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
