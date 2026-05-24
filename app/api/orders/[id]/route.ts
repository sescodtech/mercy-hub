import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models";
import { auth } from "@/lib/auth";

// ✅ Next.js 15: params is a Promise
interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();

    const order = await Order.findById(id)
      .populate("user", "name email phone")
      .populate("items.product", "name images price slug")
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Non-admin can only view their own order
    if (
      session.user.role !== "admin" &&
      order.user?.toString() !== session.user.id
    ) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("[GET /api/orders/[id]]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const body = await req.json();
    const { orderStatus, trackingNumber, note } = body;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Only admins can update order status
    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const updateFields: Record<string, unknown> = {};

    if (orderStatus) {
      updateFields.orderStatus = orderStatus;

      // Push to status history log
      updateFields.$push = {
        statusHistory: {
          status:    orderStatus,
          timestamp: new Date(),
          note:      note ?? `Status updated to ${orderStatus}`,
          updatedBy: session.user.id,
        },
      };

      // Set timestamps for specific statuses
      if (orderStatus === "delivered") updateFields.deliveredAt = new Date();
      if (orderStatus === "shipped")   updateFields.shippedAt   = new Date();
    }

    if (trackingNumber !== undefined) {
      updateFields.trackingNumber = trackingNumber;
    }

    const updated = await Order.findByIdAndUpdate(
      id,
      { $set: updateFields, ...(updateFields.$push ? { $push: updateFields.$push } : {}) },
      { new: true }
    )
      .populate("user", "name email")
      .populate("items.product", "name images price")
      .lean();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PATCH /api/orders/[id]]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
