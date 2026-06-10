import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CareerJob from "@/lib/models/Career";

export async function GET() {
  await connectDB();
  const jobs = await CareerJob.find({ isActive: true }).sort({ createdAt: -1 }).select("-applications").lean();
  return NextResponse.json({ success: true, data: jobs });
}
