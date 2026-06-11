import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import UserNotification from "@/lib/models/UserNotification";

// ── PATCH /api/notifications/[id] ──────────────────────────
// Mark read, dismiss banner, or both
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const { action } = await req.json(); // "read" | "dismiss"

  const update: Record<string, unknown> = {};
  if (action === "read" || action === "both") {
    update.isRead = true;
    update.readAt = new Date();
  }
  if (action === "dismiss" || action === "both") {
    update.isDismissed = true;
    update.dismissedAt = new Date();
    update.isRead = true;
    update.readAt = new Date();
  }

  const notif = await UserNotification.findOneAndUpdate(
    { _id: id, user: session.user.id }, // user scope — cannot touch another user's record
    update,
    { new: true }
  );

  if (!notif)
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: notif });
}
