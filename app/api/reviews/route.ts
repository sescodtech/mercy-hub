import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Review, Product, Order } from "@/lib/models";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product");
    const page      = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit     = Math.min(20, Number(searchParams.get("limit") ?? 10));
    const skip      = (page - 1) * limit;

    if (!productId) {
      return NextResponse.json({ success: false, error: "product param required" }, { status: 400 });
    }

    const [reviews, total] = await Promise.all([
      Review.find({ product: productId, isApproved: true })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ product: productId, isApproved: true }),
    ]);

    // Rating breakdown
    const breakdown = await Review.aggregate([
      { $match: { product: { $in: [productId] }, isApproved: true } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);

    return NextResponse.json({
      success: true,
      data: reviews,
      breakdown,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Please sign in to review" }, { status: 401 });
    }
    await connectDB();
    const body = await req.json();
    const { productId, rating, title, comment, images } = body;

    if (!productId || !rating) {
      return NextResponse.json({ success: false, error: "Product and rating required" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Rating must be 1–5" }, { status: 400 });
    }

    // Check if user already reviewed this product
    const existing = await Review.findOne({ product: productId, user: session.user.id });
    if (existing) {
      return NextResponse.json({ success: false, error: "You have already reviewed this product" }, { status: 400 });
    }

    // Check if user purchased this product
    const purchased = await Order.findOne({
      user: session.user.id,
      "items.product": productId,
      paymentStatus: "paid",
    });

    const review = await Review.create({
      product:    productId,
      user:       session.user.id,
      rating,
      title:      title?.trim(),
      comment:    comment?.trim(),
      images:     images ?? [],
      isVerified: !!purchased, // verified purchase badge
      isApproved: true, // auto-approve; set false if you want moderation
    });

    // Recalculate product rating
    const stats = await Review.aggregate([
      { $match: { product: review.product, isApproved: true } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (stats[0]) {
      await Product.findByIdAndUpdate(productId, {
        rating:      Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    }

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Please sign in" }, { status: 401 });
    }
    await connectDB();
    const body = await req.json();
    const { reviewId, rating, title, comment } = body;

    if (!reviewId) {
      return NextResponse.json({ success: false, error: "Review ID required" }, { status: 400 });
    }

    const review = await Review.findOne({ _id: reviewId, user: session.user.id });
    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found or unauthorized" }, { status: 404 });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json({ success: false, error: "Rating must be 1–5" }, { status: 400 });
      }
      review.rating = rating;
    }
    if (title !== undefined) review.title = title.trim();
    if (comment !== undefined) review.comment = comment.trim();

    await review.save();

    // Recalculate product rating
    const stats = await Review.aggregate([
      { $match: { product: review.product, isApproved: true } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (stats[0]) {
      await Product.findByIdAndUpdate(review.product, {
        rating:      Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    }

    return NextResponse.json({ success: true, data: review });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Please sign in" }, { status: 401 });
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json({ success: false, error: "Review ID required" }, { status: 400 });
    }

    const review = await Review.findOneAndDelete({ _id: reviewId, user: session.user.id });
    if (!review) {
      return NextResponse.json({ success: false, error: "Review not found or unauthorized" }, { status: 404 });
    }

    // Recalculate product rating
    const stats = await Review.aggregate([
      { $match: { product: review.product, isApproved: true } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (stats[0]) {
      await Product.findByIdAndUpdate(review.product, {
        rating:      Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    } else {
      await Product.findByIdAndUpdate(review.product, { rating: 0, reviewCount: 0 });
    }

    return NextResponse.json({ success: true, message: "Review deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
