import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import UserNotification from "@/lib/models/UserNotification";
import Announcement from "@/lib/models/Announcement";

// ── GET /api/notifications ──────────────────────────────────
// Returns active, non-expired notifications for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const now = new Date();

  const notifications = await UserNotification.find({ user: session.user.id })
    .populate({
      path: "announcement",
      match: {
        isPublished: true,
        startDate:   { $lte: now },
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      },
      select: "title body type priority startDate expiresAt",
    })
    .sort({ createdAt: -1 })
    .lean();

  // Filter out notifications where the announcement was filtered by match (null)
  const valid = notifications.filter((n: any) => n.announcement !== null);

  const unreadCount = valid.filter((n: any) => !n.isRead).length;

  // Banner = highest-priority undismissed announcement
  const banners = valid.filter(
    (n: any) => !n.isDismissed &&
    ["high", "urgent"].includes(n.announcement?.priority)
  );

  return NextResponse.json({
    success: true,
    data: {
      notifications: valid,
      unreadCount,
      banners,
    },
  });
}
