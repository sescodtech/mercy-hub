import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
import { auth } from "@/lib/auth";

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const order = await Order.findById(params.id)
      .populate("user", "name email")
      .populate("items.product", "name slug images sku")
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const orderUser = order.user as { _id: { toString(): string } };
    if (
      session.user.role !== "admin" &&
      orderUser._id.toString() !== session.user.id
    ) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const url  = req.url;

    let updateData: Record<string, unknown> = {};

    // Pay endpoint: /api/orders/:id/pay
    if (url.includes("/pay")) {
      updateData = {
        paymentStatus:    "paid",
        paymentReference: body.reference,
        orderStatus:      "confirmed",
      };
    } else if (session.user.role === "admin") {
      // Admin status update
      if (body.orderStatus) updateData.orderStatus = body.orderStatus;
      if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;
      if (body.trackingNumber) updateData.trackingNumber = body.trackingNumber;
      if (body.estimatedDelivery) updateData.estimatedDelivery = body.estimatedDelivery;
      if (body.orderStatus === "delivered") updateData.deliveredAt = new Date();
      if (body.orderStatus === "cancelled") {
        updateData.cancelledAt = new Date();
        updateData.cancellationReason = body.reason;
      }
    } else {
      // User cancel
      if (body.orderStatus === "cancelled") {
        updateData = {
          orderStatus: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: body.reason ?? "Cancelled by customer",
        };
      } else {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const order = await Order.findByIdAndUpdate(params.id, { $set: updateData }, { new: true });
    if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: order });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
