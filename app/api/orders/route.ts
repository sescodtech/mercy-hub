import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Coupon, Order, Product } from "@/lib/models";
import Settings from "@/lib/models/Settings";
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
    const { items, shippingAddress, paymentMethod, coupon } = body;

    if (!Array.isArray(items) || items.length === 0 || !shippingAddress || !paymentMethod) {
      return NextResponse.json({ success: false, error: "Missing required order fields" }, { status: 400 });
    }
    if (!["paystack", "flutterwave", "cod"].includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
    }

    // Never trust prices/totals supplied by the browser. Rebuild the order from MongoDB.
    const normalizedItems: any[] = [];
    let subtotal = 0;
    let freeShippingCoupon = false;
    let couponUsageIncremented = false;
    let appliedCouponCode: string | undefined;
    const reserved: Array<{ id: string; quantity: number }> = [];

    try {
      for (const rawItem of items) {
        const productId = String(rawItem?.product ?? "");
        const quantity = Math.floor(Number(rawItem?.quantity));
        if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
          throw new Error("Invalid cart item");
        }

        const product = await Product.findById(productId).lean();
        if (!product || !product.isActive) throw new Error("One of the products is no longer available");

        let price = Number(product.price);
        let variantPayload: any = undefined;
        let colorPayload: any = undefined;

        if (rawItem?.variant) {
          const variant = (product.variants || []).find((v: any) =>
            String(v._id) === String(rawItem.variant._id) ||
            (v.name === rawItem.variant.name && v.value === rawItem.variant.value)
          );
          if (!variant) throw new Error(`${product.name}: selected variant is no longer available`);
          price = Number(variant.price ?? product.price);
          variantPayload = { name: variant.name, value: variant.value };
        }

        if (rawItem?.colorVariant) {
          const cv = (product.colorVariants || []).find((v: any) => String(v._id) === String(rawItem.colorVariant._id));
          if (!cv || !cv.enabled) throw new Error(`${product.name}: selected colour is no longer available`);
          price = Number(cv.priceOverride ?? price);
          colorPayload = {
            variantId: cv._id,
            label: cv.label,
            colorHex: cv.colorHex,
            image: cv.images?.[0],
          };
        }

        // Atomic reservation prevents two customers from buying the same stock concurrently.
        if (product.trackInventory) {
          const filter: any = { _id: product._id, stock: { $gte: quantity }, isActive: true };
          const reservedProduct = await Product.findOneAndUpdate(filter, { $inc: { stock: -quantity } }, { new: true }).lean();
          if (!reservedProduct) throw new Error(`${product.name} is out of stock or has insufficient stock`);
          reserved.push({ id: String(product._id), quantity });
        }

        const lineTotal = Math.round(price * quantity);
        subtotal += lineTotal;
        normalizedItems.push({ product: product._id, variant: variantPayload, colorVariant: colorPayload, quantity, price, total: lineTotal });
      }

      let discount = 0;
      let couponData: any = undefined;
      if (coupon?.code) {
        const found = await Coupon.findOne({ code: String(coupon.code).toUpperCase().trim(), isActive: true });
        const now = new Date();
        if (!found || (found.startDate && now < found.startDate) || (found.endDate && now > found.endDate) || (found.usageLimit && found.usageCount >= found.usageLimit)) {
          throw new Error("Invalid or expired coupon");
        }
        if (found.minOrderAmount && subtotal < found.minOrderAmount) throw new Error("Minimum order amount for this coupon has not been met");
        if (found.type === "percent") discount = Math.min(Math.round(subtotal * found.value / 100), found.maxDiscountAmount ?? Number.MAX_SAFE_INTEGER);
        if (found.type === "fixed") discount = Math.min(found.value, subtotal);
        freeShippingCoupon = found.type === "free_shipping";
        appliedCouponCode = found.code;
        couponData = { code: found.code, discount, type: found.type };
      }

      // Shipping is calculated server-side from the authoritative subtotal.
      const settings = await (Settings as any).getSingleton();
      const shipping = settings?.shipping;
      let shippingCost = 0;
      if (shipping?.enabled) {
        const threshold = shipping.freeShippingThreshold ?? 100000;
        if (!(freeShippingCoupon || (shipping.freeShippingEnabled && subtotal >= threshold))) {
          const state = String(shippingAddress.state || "").toLowerCase();
          const base = shipping.defaultShippingCost ?? 2500;
          if (state.includes("lagos")) shippingCost = Math.round(base * 0.6);
          else if (["ogun","oyo","osun","ekiti","ondo"].some(x => state.includes(x))) shippingCost = Math.round(base * 0.8);
          else if (["rivers","delta","bayelsa","edo","cross river","akwa ibom","anambra","imo","enugu","ebonyi","abia"].some(x => state.includes(x))) shippingCost = base;
          else shippingCost = Math.round(base * 1.4);
        }
      }

      if (appliedCouponCode) {
        const updatedCoupon = await Coupon.findOneAndUpdate(
          { code: appliedCouponCode, isActive: true, $or: [{ usageLimit: { $exists: false } }, { usageLimit: { $gt: 0 }, $expr: { $lt: ["$usageCount", "$usageLimit"] } }] },
          { $inc: { usageCount: 1 } },
          { new: true }
        );
        if (!updatedCoupon) throw new Error("This coupon is no longer available");
        couponUsageIncremented = true;
      }

      const total = Math.max(0, subtotal + shippingCost - discount);
      const order = await Order.create({
        orderNumber: await generateOrderNumber(), user: session.user.id, items: normalizedItems,
        shippingAddress, paymentMethod, subtotal, shippingCost, discount, tax: 0, total,
        coupon: couponData, orderStatus: "pending", paymentStatus: "pending",
        statusHistory: [{ status: "pending", timestamp: new Date(), note: "Order created; stock reserved", updatedBy: session.user.id }],
      });

      return NextResponse.json({ success: true, data: order }, { status: 201 });
    } catch (error) {
      // Return any stock reservations made during a failed order creation attempt.
      await Promise.all(reserved.map(r => Product.findByIdAndUpdate(r.id, { $inc: { stock: r.quantity } }).catch(() => undefined)));
      if (couponUsageIncremented && appliedCouponCode) {
        await Coupon.findOneAndUpdate({ code: appliedCouponCode, usageCount: { $gt: 0 } }, { $inc: { usageCount: -1 } }).catch(() => undefined);
      }
      throw error;
    }
  } catch (error) {
    console.error("[POST /api/orders]", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: message === "Server error" ? 500 : 400 });
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
