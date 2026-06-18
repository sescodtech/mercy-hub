/**
 * app/api/admin/digital/promos/[id]/route.ts
 * PATCH  /api/admin/digital/promos/:id   — update a promo
 * DELETE /api/admin/digital/promos/:id   — delete a promo
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalPromo }              from "@/lib/models/DigitalModels";

const EDITABLE_FIELDS = [
  "title", "subtitle", "category", "badge", "network",
  "providerPlanId", "ctaLabel", "imageUrl", "isActive", "sortOrder", "expiresAt",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const update: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) update[field] = body[field];
    }

    const promo = await DigitalPromo.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!promo) return NextResponse.json({ success: false, error: "Promo not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: promo });
  } catch (error) {
    console.error("[PATCH /api/admin/digital/promos/:id]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();
    const promo = await DigitalPromo.findByIdAndDelete(id);
    if (!promo) return NextResponse.json({ success: false, error: "Promo not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/digital/promos/:id]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
