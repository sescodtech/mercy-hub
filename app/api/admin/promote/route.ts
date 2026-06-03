import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import { auth } from "@/lib/auth";

// POST /api/admin/promote
// Only an existing admin can promote another user to admin role
// Body: { email: string }
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden – admin only" }, { status: 403 });
    }

    await connectDB();
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (user.role === "admin") {
      return NextResponse.json({ success: false, error: "User is already an admin" }, { status: 409 });
    }

    user.role = "admin";
    await user.save();

    return NextResponse.json({
      success: true,
      message: `${user.name} (${user.email}) has been promoted to admin. They must log out and back in for it to take effect.`,
    });
  } catch (error) {
    console.error("[POST /api/admin/promote]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/admin/promote  — demote admin back to user
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden – admin only" }, { status: 403 });
    }

    await connectDB();
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // Prevent an admin from demoting themselves
    if (email.toLowerCase().trim() === session.user.email?.toLowerCase()) {
      return NextResponse.json({ success: false, error: "You cannot demote your own account" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    user.role = "user";
    await user.save();

    return NextResponse.json({
      success: true,
      message: `${user.name} (${user.email}) has been demoted to user.`,
    });
  } catch (error) {
    console.error("[DELETE /api/admin/promote]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
