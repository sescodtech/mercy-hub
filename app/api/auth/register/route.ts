import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "All fields are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: "user",
      isVerified: false,
    });

    return NextResponse.json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email },
    }, { status: 201 });

  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      return NextResponse.json({ success: false, error: "Email already in use." }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Server error." }, { status: 500 });
  }
}
