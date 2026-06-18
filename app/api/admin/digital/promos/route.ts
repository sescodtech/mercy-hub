/**
 * app/api/admin/digital/promos/route.ts
 * GET  /api/admin/digital/promos          — list all promos (deals + promo products), including inactive
 * POST /api/admin/digital/promos          — create a new promo
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalPromo }              from "@/lib/models/DigitalModels";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const query: Record<string, unknown> = {};
    if (type === "deal" || type === "promo") query.type = type;

    const promos = await DigitalPromo.find(query).sort({ type: 1, sortOrder: 1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: promos });
  } catch (error) {
    console.error("[GET /api/admin/digital/promos]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    if (!body.title || !body.type || !body.category) {
      return NextResponse.json({ success: false, error: "title, type, and category are required" }, { status: 400 });
    }

    const promo = await DigitalPromo.create({
      type:           body.type,
      title:          body.title,
      subtitle:       body.subtitle || undefined,
      category:       body.category,
      badge:          body.badge || undefined,
      network:        body.network || undefined,
      providerPlanId: body.providerPlanId || undefined,
      ctaLabel:       body.ctaLabel || undefined,
      imageUrl:       body.imageUrl || undefined,
      isActive:       body.isActive ?? true,
      sortOrder:      body.sortOrder ?? 0,
      expiresAt:      body.expiresAt || undefined,
    });

    return NextResponse.json({ success: true, data: promo });
  } catch (error) {
    console.error("[POST /api/admin/digital/promos]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
