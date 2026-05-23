import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { code, orderAmount } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon) {
      return NextResponse.json({ success: false, error: "Invalid or expired coupon" }, { status: 400 });
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return NextResponse.json({ success: false, error: "Coupon is not yet active" }, { status: 400 });
    }
    if (coupon.endDate && now > coupon.endDate) {
      return NextResponse.json({ success: false, error: "Coupon has expired" }, { status: 400 });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ success: false, error: "Coupon usage limit reached" }, { status: 400 });
    }
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return NextResponse.json({
        success: false,
        error: `Minimum order of ₦${coupon.minOrderAmount.toLocaleString()} required`,
      }, { status: 400 });
    }

    let discount = 0;
    if (coupon.type === "percent") {
      discount = (orderAmount * coupon.value) / 100;
      if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
    } else if (coupon.type === "fixed") {
      discount = Math.min(coupon.value, orderAmount);
    } else if (coupon.type === "free_shipping") {
      discount = 0; // handled in checkout
    }

    return NextResponse.json({
      success: true,
      data: {
        code:     coupon.code,
        type:     coupon.type,
        value:    coupon.value,
        discount: Math.round(discount),
      },
    });
  } catch (error) {
    console.error("[POST /api/coupons/validate]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
