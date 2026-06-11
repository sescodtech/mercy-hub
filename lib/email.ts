import nodemailer from "nodemailer";

// Reuse the same transporter pattern already in /api/contact/route.ts
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   ?? "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const FROM = () =>
  `"Mercy Home Essentials" <${process.env.SMTP_USER ?? "noreply@mercyhome.ng"}>`;

// Type badge colours for email rendering
const TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  info:        { bg: "#dbeafe", color: "#1d4ed8", label: "Info" },
  success:     { bg: "#dcfce7", color: "#15803d", label: "Update" },
  warning:     { bg: "#fef9c3", color: "#a16207", label: "Warning" },
  maintenance: { bg: "#fce7f3", color: "#be185d", label: "Maintenance" },
  update:      { bg: "#f3e8ff", color: "#7e22ce", label: "New Feature" },
};

export interface AnnouncementEmailOptions {
  to:       string;
  name:     string;
  title:    string;
  body:     string;
  type:     string;
  priority: string;
  storeUrl: string;
  businessName: string;
}

export async function sendAnnouncementEmail(opts: AnnouncementEmailOptions): Promise<boolean> {
  const style = TYPE_STYLES[opts.type] ?? TYPE_STYLES.info;
  const isUrgent = opts.priority === "urgent" || opts.priority === "high";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f9f6f1;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f1;padding:32px 16px">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
            <!-- Header -->
            <tr>
              <td style="background:#1a1108;padding:28px 32px;text-align:center">
                <span style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#ffffff">
                  Mercy<span style="color:#d98c2a">Home</span>
                </span>
                <p style="margin:4px 0 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.4)">
                  Essentials
                </p>
              </td>
            </tr>
            <!-- Type badge -->
            <tr>
              <td style="padding:24px 32px 0">
                <span style="display:inline-block;padding:4px 12px;background:${style.bg};color:${style.color};border-radius:99px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">
                  ${style.label}${isUrgent ? " · Important" : ""}
                </span>
              </td>
            </tr>
            <!-- Title -->
            <tr>
              <td style="padding:16px 32px 0">
                <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1a1108;line-height:1.3">
                  ${opts.title}
                </h1>
              </td>
            </tr>
            <!-- Greeting -->
            <tr>
              <td style="padding:20px 32px 0">
                <p style="margin:0;font-size:14px;color:#555;line-height:1.6">Hi ${opts.name},</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:12px 32px 0">
                <div style="font-size:14px;color:#555;line-height:1.7;border-left:3px solid #d98c2a;padding-left:16px;background:#fdf8f0;border-radius:0 8px 8px 0;padding:16px 16px 16px 20px">
                  ${opts.body.replace(/\n/g, "<br/>")}
                </div>
              </td>
            </tr>
            <!-- CTA -->
            <tr>
              <td style="padding:28px 32px 0;text-align:center">
                <a href="${opts.storeUrl}" style="display:inline-block;padding:13px 32px;background:#d98c2a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.02em">
                  Visit Our Store
                </a>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:28px 32px;border-top:1px solid #f0ebe3;margin-top:24px;text-align:center">
                <p style="margin:0;font-size:11px;color:#bbb;line-height:1.6">
                  You received this because you have an account at ${opts.businessName}.<br/>
                  © ${new Date().getFullYear()} ${opts.businessName}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from:    FROM(),
      to:      opts.to,
      subject: `${isUrgent ? "🔔 " : ""}${opts.title} — ${opts.businessName}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[sendAnnouncementEmail] Failed:", err);
    return false;
  }
}

// Batch send — returns count of successful sends
export async function sendAnnouncementBatch(
  recipients: { email: string; name: string }[],
  opts: Omit<AnnouncementEmailOptions, "to" | "name">
): Promise<number> {
  let sent = 0;
  // Send in chunks of 10 to avoid overwhelming SMTP
  const CHUNK = 10;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    await Promise.allSettled(
      chunk.map((r) =>
        sendAnnouncementEmail({ ...opts, to: r.email, name: r.name })
          .then((ok) => { if (ok) sent++; })
      )
    );
  }
  return sent;
}
