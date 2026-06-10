import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import CareerJob from "@/lib/models/Career";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ success: false }, { status: 403 });
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  delete body._id; delete body.__v;
  const job = await CareerJob.findByIdAndUpdate(id, body, { new: true });
  if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: job });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ success: false }, { status: 403 });
  await connectDB();
  const { id } = await params;
  await CareerJob.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
