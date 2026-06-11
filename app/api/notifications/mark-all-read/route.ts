import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import UserNotification from "@/lib/models/UserNotification";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  await connectDB();
  await UserNotification.updateMany(
    { user: session.user.id, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return NextResponse.json({ success: true });
}
