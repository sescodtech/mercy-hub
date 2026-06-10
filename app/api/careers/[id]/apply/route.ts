import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CareerJob from "@/lib/models/Career";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await params;
  const { name, email, phone, coverLetter, cvUrl } = await req.json();
  if (!name || !email) return NextResponse.json({ success: false, error: "Name and email required" }, { status: 400 });
  const job = await CareerJob.findById(id);
  if (!job || !job.isActive) return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  job.applications.push({ name, email, phone: phone || "", coverLetter: coverLetter || "", cvUrl: cvUrl || "", appliedAt: new Date(), notes: "" } as any);
  await job.save();
  return NextResponse.json({ success: true, message: "Application submitted" }, { status: 201 });
}
