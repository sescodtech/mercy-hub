import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import Settings from "@/lib/models/Settings";
import { connectDB } from "@/lib/db";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   ?? "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, error: "Name, email and message required" }, { status: 400 });
    }

    const settings = await (Settings as any).getSingleton();
    const adminEmail = settings?.notifications?.adminEmail || process.env.SMTP_USER;

    await transporter.sendMail({
      from:    `"${settings?.businessName ?? "Mercy Home"}" <${process.env.SMTP_USER}>`,
      to:      adminEmail,
      replyTo: email,
      subject: `Contact Form: ${subject || "New message from " + name}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1a1208;margin-bottom:4px">New Contact Message</h2>
          <p style="color:#999;font-size:12px;margin-bottom:24px">From ${settings?.businessName ?? "Mercy Home"} contact form</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:10px 0;color:#666;width:100px">Name</td><td style="padding:10px 0;font-weight:600;color:#1a1a1a">${name}</td></tr>
            <tr><td style="padding:10px 0;color:#666">Email</td><td style="padding:10px 0;color:#1a1a1a">${email}</td></tr>
            <tr><td style="padding:10px 0;color:#666">Phone</td><td style="padding:10px 0;color:#1a1a1a">${phone || "—"}</td></tr>
            <tr><td style="padding:10px 0;color:#666">Subject</td><td style="padding:10px 0;color:#1a1a1a">${subject || "—"}</td></tr>
          </table>
          <div style="margin-top:20px;padding:16px;background:#f9f9f9;border-radius:8px;font-size:14px;color:#333;line-height:1.6">
            ${message.replace(/\n/g, "<br>")}
          </div>
          <p style="margin-top:24px;font-size:12px;color:#999">Reply directly to this email to respond to ${name}.</p>
        </div>
      `,
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from:    `"${settings?.businessName ?? "Mercy Home Essentials"}" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: `We received your message — ${settings?.businessName ?? "Mercy Home"}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#1a1208">Hi ${name},</h2>
          <p style="color:#555;font-size:14px;line-height:1.6">
            Thank you for reaching out! We've received your message and will get back to you within 24 hours.
          </p>
          <div style="margin:24px 0;padding:16px;background:#fdf8f0;border-left:4px solid #d98c2a;border-radius:4px;font-size:14px;color:#555">
            <strong>Your message:</strong><br/><br/>
            ${message.replace(/\n/g, "<br>")}
          </div>
          <p style="color:#555;font-size:14px">
            In the meantime, you can browse our store at 
            <a href="${settings?.website || "https://mercy-hub.vercel.app"}" style="color:#d98c2a">${settings?.businessName ?? "Mercy Home"}</a>.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#ccc;font-size:11px;text-align:center">© ${new Date().getFullYear()} ${settings?.businessName ?? "Mercy Home Essentials"}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("[POST /api/contact]", error);
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
