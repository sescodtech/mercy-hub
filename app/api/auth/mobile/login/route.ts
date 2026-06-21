import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, error: "This account uses Google sign-in. Please use the web app to sign in." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "30d" }
    );

    const safeUser = {
      _id:           user._id.toString(),
      name:          user.name,
      email:         user.email,
      avatar:        user.avatar,
      role:          user.role,
      isVerified:    user.isVerified,
      hasPassword:   true,
      walletBalance: user.walletBalance || 0,
    };

    return NextResponse.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error("[mobile/login]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
