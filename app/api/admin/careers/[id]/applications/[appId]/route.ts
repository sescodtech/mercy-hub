import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import CareerJob from "@/lib/models/Career";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; appId: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ success: false }, { status: 403 });
  await connectDB();
  const { id, appId } = await params;
  const { status, notes } = await req.json();
  const job = await CareerJob.findById(id);
  if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  const app = job.applications.id(appId);
  if (!app) return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
  if (status) app.status = status;
  if (notes !== undefined) app.notes = notes;
  await job.save();
  return NextResponse.json({ success: true, data: app });
}
