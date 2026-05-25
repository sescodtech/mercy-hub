import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { code, orderAmount } = await req.json();

    if (!code?.trim()) {
      return NextResponse.json({ success: false, error: "Coupon code required" }, { status: 400 });
    }

    const coupon = await Coupon.findOne({
      code:     code.toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      return NextResponse.json({ success: false, error: "Invalid or expired coupon code" }, { status: 404 });
    }

    // Check expiry
    if (coupon.endDate && new Date() > new Date(coupon.endDate)) {
      return NextResponse.json({ success: false, error: "This coupon has expired" }, { status: 400 });
    }

    // Check start date
    if (coupon.startDate && new Date() < new Date(coupon.startDate)) {
      return NextResponse.json({ success: false, error: "This coupon is not yet active" }, { status: 400 });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ success: false, error: "This coupon has reached its usage limit" }, { status: 400 });
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return NextResponse.json({
        success: false,
        error: `Minimum order of ${new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(coupon.minOrderAmount)} required for this coupon`,
      }, { status: 400 });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "percent") {
      discount = Math.round((orderAmount * coupon.value) / 100);
      if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
    } else if (coupon.type === "fixed") {
      discount = Math.min(coupon.value, orderAmount);
    } else if (coupon.type === "free_shipping") {
      discount = 0; // handled separately in checkout
    }

    return NextResponse.json({
      success: true,
      data: {
        code:     coupon.code,
        type:     coupon.type,
        value:    coupon.value,
        discount,
        isFreeShipping: coupon.type === "free_shipping",
      },
    });
  } catch (error) {
    console.error("[POST /api/coupons/validate]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
