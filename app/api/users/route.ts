import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const user = await User.findById(session.user.id)
      .select("-resetToken -resetTokenExpiry")
      .lean() as (Record<string, unknown> & { password?: string }) | null;
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    // Expose whether the user has a password (false = Google/OAuth user)
    // but never expose the hash itself
    const hasPassword = !!user.password;
    const { password: _pw, ...safeUser } = user;
    return NextResponse.json({ success: true, data: { ...safeUser, hasPassword } });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    const body = await req.json();
    const { name, phone, avatar, address, currentPassword, newPassword } = body;

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Update basic fields
    if (name)    user.name    = name.trim();
    if (phone)   user.phone   = phone.trim();
    if (avatar)  user.avatar  = avatar;
    if (address) user.address = address;

    // Password change / creation
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
      }
      // Fetch password field explicitly (select: false by default)
      const userWithPw = await User.findById(session.user.id).select("+password");
      const hasPassword = !!userWithPw?.password;

      if (hasPassword) {
        // Existing password user — must verify current password first
        if (!currentPassword) {
          return NextResponse.json({ success: false, error: "Current password required" }, { status: 400 });
        }
        const valid = await bcrypt.compare(currentPassword, userWithPw!.password);
        if (!valid) {
          return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 400 });
        }
      }
      // Google/OAuth user with no password — allow setting one directly
      user.password = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    const updated = await User.findById(session.user.id)
      .select("-password -resetToken -resetTokenExpiry")
      .lean();

    return NextResponse.json({ success: true, data: updated, message: "Profile updated successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
