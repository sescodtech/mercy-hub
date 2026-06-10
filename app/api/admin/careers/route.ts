import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import CareerJob from "@/lib/models/Career";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ success: false }, { status: 403 });
  await connectDB();
  const jobs = await CareerJob.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, data: jobs });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ success: false }, { status: 403 });
  await connectDB();
  const body = await req.json();
  if (!body.title) return NextResponse.json({ success: false, error: "Title required" }, { status: 400 });
  const job = await CareerJob.create(body);
  return NextResponse.json({ success: true, data: job }, { status: 201 });
}
