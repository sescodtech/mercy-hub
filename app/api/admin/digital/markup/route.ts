/**
 * app/api/admin/digital/markup/route.ts
 * GET  /api/admin/digital/markup   — fetch current markup config
 * POST /api/admin/digital/markup   — update markup percentages
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { getDigitalConfig }          from "@/services/vtu/helpers";
import { DigitalConfig }             from "@/lib/models/DigitalModels";
import { connectDB }                 from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const config = await getDigitalConfig();
    return NextResponse.json({ success: true, markup: config.markup, services: config.services });
  } catch (error) {
    console.error("[GET /api/admin/digital/markup]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    await connectDB();

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.markup)   update.markup   = body.markup;
    if (body.services) update.services = body.services;

    await DigitalConfig.findOneAndUpdate(
      { name: "default" },
      { $set: update },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("[POST /api/admin/digital/markup]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
