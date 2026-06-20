import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   ?? "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordResetToken +passwordResetExpires");

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true, message: "If that email exists, a reset link has been sent." });
    }

    // Generate token
    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    user.passwordResetToken   = token;
    user.passwordResetExpires = expires;
    await user.save();

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await transporter.sendMail({
      from:    `"Mercy Home Essentials" <${process.env.SMTP_USER}>`,
      to:      user.email,
      subject: "Reset your password — Mercy Home Essentials",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1a1208;font-size:22px;margin-bottom:8px">Reset Your Password</h2>
          <p style="color:#555;font-size:14px;line-height:1.6">Hi ${user.name},</p>
          <p style="color:#555;font-size:14px;line-height:1.6">
            We received a request to reset your password. Click the button below to choose a new one.
            This link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}"
              style="background:#d98c2a;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block">
              Reset Password
            </a>
          </div>
          <p style="color:#999;font-size:12px">If you didn't request this, ignore this email. Your password won't change.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#ccc;font-size:11px;text-align:center">© ${new Date().getFullYear()} Mercy Home Essentials</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
