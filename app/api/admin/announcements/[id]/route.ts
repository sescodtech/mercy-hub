import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Announcement from "@/lib/models/Announcement";
import { fanOut } from "../route";

// ── PUT /api/admin/announcements/[id] ────────────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin")
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  delete body._id; delete body.__v;

  const prev = await Announcement.findById(id);
  if (!prev)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const wasUnpublished = !prev.isPublished;
  const nowPublishing  = body.isPublished === true;

  // Set publishedAt on first publish
  if (wasUnpublished && nowPublishing && !body.publishedAt) {
    body.publishedAt = new Date();
  }

  const updated = await Announcement.findByIdAndUpdate(id, body, { new: true, runValidators: true });

  // Fan out only when transitioning from draft → published
  if (wasUnpublished && nowPublishing && updated) {
    await fanOut(updated, session.user.id);
  }

  return NextResponse.json({ success: true, data: updated });
}

// ── DELETE /api/admin/announcements/[id] ─────────────────────
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin")
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;
  await Announcement.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
