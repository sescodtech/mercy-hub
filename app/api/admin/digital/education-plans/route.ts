/**
 * app/api/admin/digital/education-plans/route.ts
 * GET    /api/admin/digital/education-plans          — list catalog
 * POST   /api/admin/digital/education-plans          — add a new exam pin product
 * PATCH  /api/admin/digital/education-plans           — update an existing entry (by id in body)
 * DELETE /api/admin/digital/education-plans?id=waec_1 — remove an entry
 *
 * examName is restricted to what the connected provider (GladTidings) actually
 * supports — adding an unsupported exam would let customers pay for something
 * that always fails dispatch. See services/vtu/gladtidings.ts buyExamPin().
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalConfig }             from "@/lib/models/DigitalModels";
import { getDigitalConfig }          from "@/services/vtu/helpers";

const SUPPORTED_EXAMS = ["WAEC", "NECO", "NABTEB"];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const config = await getDigitalConfig();
    return NextResponse.json({ success: true, data: config.educationPlans || [], supportedExams: SUPPORTED_EXAMS });
  } catch (error) {
    console.error("[GET /api/admin/digital/education-plans]", error);
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
    const examName = String(body.examName || "").toUpperCase();
    if (!SUPPORTED_EXAMS.includes(examName)) {
      return NextResponse.json({ success: false, error: `Provider only supports: ${SUPPORTED_EXAMS.join(", ")}` }, { status: 400 });
    }
    if (!body.name || !body.costPrice) {
      return NextResponse.json({ success: false, error: "name and costPrice are required" }, { status: 400 });
    }

    await connectDB();
    const config = await getDigitalConfig();
    const id = `${examName.toLowerCase()}_${Date.now()}`;

    const newPlan = {
      id, examName, name: body.name,
      costPrice: Number(body.costPrice),
      quantity: Number(body.quantity) || 1,
      isActive: body.isActive ?? true,
    };

    config.educationPlans = [...(config.educationPlans || []), newPlan] as typeof config.educationPlans;
    await config.save();

    return NextResponse.json({ success: true, data: newPlan });
  } catch (error) {
    console.error("[POST /api/admin/digital/education-plans]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

    if (body.examName && !SUPPORTED_EXAMS.includes(String(body.examName).toUpperCase())) {
      return NextResponse.json({ success: false, error: `Provider only supports: ${SUPPORTED_EXAMS.join(", ")}` }, { status: 400 });
    }

    await connectDB();
    const config = await getDigitalConfig();
    const plans = config.educationPlans || [];
    const idx = plans.findIndex((p) => p.id === body.id);
    if (idx === -1) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });

    if (body.name !== undefined)      plans[idx].name = body.name;
    if (body.costPrice !== undefined) plans[idx].costPrice = Number(body.costPrice);
    if (body.quantity !== undefined)  plans[idx].quantity = Number(body.quantity);
    if (body.isActive !== undefined)  plans[idx].isActive = body.isActive;
    if (body.examName !== undefined)  plans[idx].examName = String(body.examName).toUpperCase();

    config.educationPlans = plans;
    await config.save();

    return NextResponse.json({ success: true, data: plans[idx] });
  } catch (error) {
    console.error("[PATCH /api/admin/digital/education-plans]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });

    await connectDB();
    const config = await getDigitalConfig();
    config.educationPlans = (config.educationPlans || []).filter((p) => p.id !== id) as typeof config.educationPlans;
    await config.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/digital/education-plans]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
