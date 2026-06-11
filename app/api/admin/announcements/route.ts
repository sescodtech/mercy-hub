import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import Announcement from "@/lib/models/Announcement";
import UserNotification from "@/lib/models/UserNotification";
import { User } from "@/lib/models";
import { sendAnnouncementBatch } from "@/lib/email";
import Settings from "@/lib/models/Settings";

// ── GET /api/admin/announcements ─────────────────────────────
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin")
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  await connectDB();
  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "name email")
    .lean();

  return NextResponse.json({ success: true, data: announcements });
}

// ── POST /api/admin/announcements ────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin")
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  await connectDB();
  const body = await req.json();

  if (!body.title?.trim() || !body.body?.trim())
    return NextResponse.json({ success: false, error: "Title and body are required" }, { status: 400 });

  const announcement = await Announcement.create({
    ...body,
    createdBy:   session.user.id,
    publishedAt: body.isPublished ? new Date() : null,
  });

  // Fan out in-app notifications and emails if publishing immediately
  if (announcement.isPublished) {
    await fanOut(announcement, session.user.id);
  }

  return NextResponse.json({ success: true, data: announcement }, { status: 201 });
}

// ── Shared fan-out helper ─────────────────────────────────────
export async function fanOut(announcement: any, adminId: string) {
  await connectDB();

  // Resolve target users
  const userQuery: Record<string, unknown> = {};
  if (announcement.audience === "admins") userQuery.role = "admin";
  else if (announcement.audience === "customers") userQuery.role = "user";
  // "all" → no filter

  const users = await User.find(userQuery).select("_id email name").lean();

  // Create UserNotification docs (ignore duplicates)
  if (announcement.sendInApp && users.length > 0) {
    const docs = users.map((u: any) => ({
      user:         u._id,
      announcement: announcement._id,
      isRead:       false,
      isDismissed:  false,
    }));
    // insertMany with ordered:false — skips duplicates via unique index
    await UserNotification.insertMany(docs, { ordered: false }).catch(() => {});
  }

  // Send emails
  if (announcement.sendEmail && users.length > 0) {
    const settings = await (Settings as any).getSingleton();
    const storeUrl = settings?.website || process.env.NEXT_PUBLIC_APP_URL || "https://mercyhomeessentials.com";
    const businessName = settings?.businessName || "Mercy Home Essentials";

    const sent = await sendAnnouncementBatch(
      users.map((u: any) => ({ email: u.email, name: u.name })),
      {
        title: announcement.title,
        body:  announcement.body,
        type:  announcement.type,
        priority: announcement.priority,
        storeUrl,
        businessName,
      }
    );

    await announcement.updateOne({
      emailSentAt: new Date(),
      emailSentCount: sent,
    });
  }
}
