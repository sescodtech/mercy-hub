import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, Product } from "@/lib/models";
import { auth } from "@/lib/auth";
import { generateOrderNumber } from "@/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const {
      items, shippingAddress, paymentMethod,
      subtotal, shippingCost, discount, tax, total, coupon,
    } = body;

    if (!items?.length || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ success: false, error: "Missing required order fields" }, { status: 400 });
    }

    // Validate and deduct stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json({ success: false, error: `Product not found: ${item.product}` }, { status: 400 });
      }
      if (product.trackInventory && product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for: ${product.name}` },
          { status: 400 }
        );
      }
    }

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user:        session.user.id,
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      discount,
      tax,
      total,
      coupon,
      orderStatus:   "pending",
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
    });

    // Deduct stock (only after order created)
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1));
    const limit = Math.min(20, Number(searchParams.get("limit") ?? 10));
    const skip  = (page - 1) * limit;

    const query = session.user.role === "admin"
      ? {}
      : { user: session.user.id };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("items.product", "name slug images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
