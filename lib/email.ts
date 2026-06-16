import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   ?? "smtp.gmail.com",
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const FROM = () =>
  `"Mercy Home Essentials" <${process.env.SMTP_USER ?? "noreply@mercyhome.ng"}>`;

const BRAND = {
  dark:    "#1a1108",
  gold:    "#d98c2a",
  cream:   "#fdf8f0",
  text:    "#555555",
  border:  "#f0ebe3",
};

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.cream};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream};padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND.dark};padding:28px 32px;text-align:center">
            <span style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#ffffff">
              Mercy<span style="color:${BRAND.gold}">Home</span>
            </span>
            <p style="margin:4px 0 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.4)">
              Essentials
            </p>
          </td>
        </tr>
        ${content}
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid ${BRAND.border};text-align:center">
            <p style="margin:0;font-size:11px;color:#bbb;line-height:1.6">
              © ${new Date().getFullYear()} Mercy Home Essentials · All rights reserved.<br/>
              Questions? Reply to this email or WhatsApp us.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Order Confirmation Email (to customer) ───────────────────
export interface OrderConfirmationData {
  customerName:  string;
  customerEmail: string;
  orderNumber:   string;
  total:         number;
  items:         { name: string; quantity: number; price: number; image?: string }[];
  shippingAddress: {
    addressLine1: string; city: string; state: string;
  };
  shippingCost:  number;
  discount?:     number;
  storeUrl:      string;
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<boolean> {
  const itemsRows = data.items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f5f0e8;font-size:13px;color:${BRAND.text}">
        ${item.name}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f5f0e8;text-align:center;font-size:13px;color:${BRAND.text}">
        ×${item.quantity}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f5f0e8;text-align:right;font-size:13px;font-weight:600;color:#1a1108">
        ${formatNaira(item.price * item.quantity)}
      </td>
    </tr>
  `).join("");

  const content = `
    <!-- Badge -->
    <tr>
      <td style="padding:28px 32px 0">
        <span style="display:inline-block;padding:4px 12px;background:#dcfce7;color:#15803d;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">
          ✓ Order Confirmed
        </span>
      </td>
    </tr>
    <!-- Title -->
    <tr>
      <td style="padding:16px 32px 0">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1a1108">
          Thank you, ${data.customerName.split(" ")[0]}!
        </h1>
      </td>
    </tr>
    <!-- Intro -->
    <tr>
      <td style="padding:12px 32px 0">
        <p style="margin:0;font-size:14px;color:${BRAND.text};line-height:1.7">
          Your order has been received and payment confirmed. We&apos;re preparing your items for delivery.
        </p>
      </td>
    </tr>
    <!-- Order number box -->
    <tr>
      <td style="padding:20px 32px 0">
        <div style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:10px;padding:16px 20px;text-align:center">
          <p style="margin:0 0 4px;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.1em">Order Number</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#1a1108;letter-spacing:0.05em;font-family:monospace">
            ${data.orderNumber}
          </p>
          <p style="margin:6px 0 0;font-size:11px;color:#aaa">Use this to track your order</p>
        </div>
      </td>
    </tr>
    <!-- Items -->
    <tr>
      <td style="padding:24px 32px 0">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#aaa">
          Items Ordered
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${itemsRows}
          <tr>
            <td colspan="2" style="padding:12px 0 4px;font-size:12px;color:#aaa">Shipping</td>
            <td style="padding:12px 0 4px;text-align:right;font-size:13px;font-weight:600;color:#1a1108">
              ${data.shippingCost === 0 ? "Free 🎉" : formatNaira(data.shippingCost)}
            </td>
          </tr>
          ${data.discount && data.discount > 0 ? `
          <tr>
            <td colspan="2" style="padding:4px 0;font-size:12px;color:#15803d">Discount</td>
            <td style="padding:4px 0;text-align:right;font-size:13px;font-weight:600;color:#15803d">
              -${formatNaira(data.discount)}
            </td>
          </tr>` : ""}
          <tr>
            <td colspan="2" style="padding:12px 0 0;font-size:14px;font-weight:700;color:#1a1108;border-top:2px solid #f0ebe3">
              Total Paid
            </td>
            <td style="padding:12px 0 0;text-align:right;font-size:18px;font-weight:700;color:#1a1108;border-top:2px solid #f0ebe3">
              ${formatNaira(data.total)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Delivery address -->
    <tr>
      <td style="padding:20px 32px 0">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#aaa">
          Delivery Address
        </p>
        <p style="margin:0;font-size:13px;color:${BRAND.text};line-height:1.6">
          ${data.shippingAddress.addressLine1},<br/>
          ${data.shippingAddress.city}, ${data.shippingAddress.state}, Nigeria
        </p>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding:28px 32px;text-align:center">
        <a href="${data.storeUrl}/dashboard/orders"
          style="display:inline-block;padding:13px 32px;background:${BRAND.gold};color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.02em">
          Track My Order
        </a>
      </td>
    </tr>
  `;

  try {
    await transporter.sendMail({
      from:    FROM(),
      to:      data.customerEmail,
      subject: `Order Confirmed — ${data.orderNumber} | Mercy Home Essentials`,
      html:    emailWrapper(content),
    });
    return true;
  } catch (err) {
    console.error("[sendOrderConfirmationEmail]", err);
    return false;
  }
}

// ─── Order Status Update Email (to customer) ─────────────────
export interface OrderStatusData {
  customerName:  string;
  customerEmail: string;
  orderNumber:   string;
  status:        string;
  trackingNumber?: string;
  storeUrl:      string;
}

const STATUS_MESSAGES: Record<string, { label: string; message: string; color: string; bg: string }> = {
  confirmed:        { label: "Order Confirmed",        color: "#15803d", bg: "#dcfce7", message: "Great news! We have confirmed your order and our team is preparing it for dispatch." },
  processing:       { label: "Being Processed",        color: "#6d28d9", bg: "#ede9fe", message: "Your order is currently being packed and quality-checked by our team." },
  shipped:          { label: "Order Shipped",           color: "#1d4ed8", bg: "#dbeafe", message: "Your order is on its way! Our delivery partner has picked it up." },
  out_for_delivery: { label: "Out for Delivery",        color: "#c2410c", bg: "#ffedd5", message: "Exciting! Your order is out for delivery today. Please ensure someone is available to receive it." },
  delivered:        { label: "Order Delivered",         color: "#15803d", bg: "#dcfce7", message: "Your order has been delivered. We hope you love your new home essentials!" },
  cancelled:        { label: "Order Cancelled",         color: "#dc2626", bg: "#fee2e2", message: "Your order has been cancelled. If you have any questions, please contact us." },
};

export async function sendOrderStatusEmail(data: OrderStatusData): Promise<boolean> {
  const statusInfo = STATUS_MESSAGES[data.status] ?? STATUS_MESSAGES.confirmed;

  const content = `
    <tr>
      <td style="padding:28px 32px 0">
        <span style="display:inline-block;padding:4px 12px;background:${statusInfo.bg};color:${statusInfo.color};border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">
          ${statusInfo.label}
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px 0">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1a1108">
          Order Update
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 32px 0">
        <p style="margin:0;font-size:14px;color:${BRAND.text};line-height:1.7">
          Hi ${data.customerName.split(" ")[0]},<br/><br/>
          ${statusInfo.message}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 32px 0">
        <div style="background:${BRAND.cream};border:1px solid ${BRAND.border};border-radius:10px;padding:16px 20px;text-align:center">
          <p style="margin:0 0 4px;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.1em">Order Number</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#1a1108;font-family:monospace">${data.orderNumber}</p>
          ${data.trackingNumber ? `
          <p style="margin:8px 0 0;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:0.1em">Tracking Number</p>
          <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#1a1108;font-family:monospace">${data.trackingNumber}</p>
          ` : ""}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 32px;text-align:center">
        <a href="${data.storeUrl}/dashboard/orders"
          style="display:inline-block;padding:13px 32px;background:${BRAND.gold};color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">
          View Order Details
        </a>
      </td>
    </tr>
  `;

  try {
    await transporter.sendMail({
      from:    FROM(),
      to:      data.customerEmail,
      subject: `${statusInfo.label} — ${data.orderNumber} | Mercy Home Essentials`,
      html:    emailWrapper(content),
    });
    return true;
  } catch (err) {
    console.error("[sendOrderStatusEmail]", err);
    return false;
  }
}

// ─── Admin Order Alert Email ──────────────────────────────────
export async function sendAdminOrderAlert(data: {
  orderNumber: string;
  customerName: string;
  total: number;
  items: { name: string; quantity: number }[];
  shippingAddress: { city: string; state: string };
}): Promise<boolean> {
  const itemsList = data.items.map((i) => `• ${i.name} ×${i.quantity}`).join("<br/>");

  const content = `
    <tr>
      <td style="padding:28px 32px 0">
        <span style="display:inline-block;padding:4px 12px;background:#dbeafe;color:#1d4ed8;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">
          💰 New Order
        </span>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 32px">
        <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;color:#1a1108">New Order Received</h1>
        <div style="background:#f9f6f1;border-radius:10px;padding:16px 20px">
          <p style="margin:0 0 8px;font-size:13px;color:#555"><strong>Order:</strong> ${data.orderNumber}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#555"><strong>Customer:</strong> ${data.customerName}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#555"><strong>Total:</strong> ₦${data.total.toLocaleString()}</p>
          <p style="margin:0 0 8px;font-size:13px;color:#555"><strong>Location:</strong> ${data.shippingAddress.city}, ${data.shippingAddress.state}</p>
          <p style="margin:8px 0 0;font-size:12px;color:#aaa">${itemsList}</p>
        </div>
        <div style="text-align:center;margin-top:20px">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders"
            style="display:inline-block;padding:12px 28px;background:#d98c2a;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600">
            View in Admin Panel
          </a>
        </div>
      </td>
    </tr>
  `;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "";
  if (!adminEmail) return false;

  try {
    await transporter.sendMail({
      from:    FROM(),
      to:      adminEmail,
      subject: `🛒 New Order ${data.orderNumber} — ₦${data.total.toLocaleString()}`,
      html:    emailWrapper(content),
    });
    return true;
  } catch (err) {
    console.error("[sendAdminOrderAlert]", err);
    return false;
  }
}

// ─── Existing announcement email (unchanged) ─────────────────
const TYPE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  info:        { bg: "#dbeafe", color: "#1d4ed8", label: "Info" },
  success:     { bg: "#dcfce7", color: "#15803d", label: "Update" },
  warning:     { bg: "#fef9c3", color: "#a16207", label: "Warning" },
  maintenance: { bg: "#fce7f3", color: "#be185d", label: "Maintenance" },
  update:      { bg: "#f3e8ff", color: "#7e22ce", label: "New Feature" },
};

export interface AnnouncementEmailOptions {
  to: string; name: string; title: string; body: string;
  type: string; priority: string; storeUrl: string; businessName: string;
}

export async function sendAnnouncementEmail(opts: AnnouncementEmailOptions): Promise<boolean> {
  const style    = TYPE_STYLES[opts.type] ?? TYPE_STYLES.info;
  const isUrgent = opts.priority === "urgent" || opts.priority === "high";
  const content  = `
    <tr><td style="padding:24px 32px 0">
      <span style="display:inline-block;padding:4px 12px;background:${style.bg};color:${style.color};border-radius:99px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">
        ${style.label}${isUrgent ? " · Important" : ""}
      </span>
    </td></tr>
    <tr><td style="padding:16px 32px 0">
      <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#1a1108">${opts.title}</h1>
    </td></tr>
    <tr><td style="padding:20px 32px 0">
      <p style="margin:0;font-size:14px;color:#555;line-height:1.6">Hi ${opts.name},</p>
    </td></tr>
    <tr><td style="padding:12px 32px 0">
      <div style="font-size:14px;color:#555;line-height:1.7;border-left:3px solid #d98c2a;padding:16px 16px 16px 20px;background:#fdf8f0;border-radius:0 8px 8px 0">
        ${opts.body.replace(/\n/g, "<br/>")}
      </div>
    </td></tr>
    <tr><td style="padding:28px 32px;text-align:center">
      <a href="${opts.storeUrl}" style="display:inline-block;padding:13px 32px;background:#d98c2a;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">
        Visit Our Store
      </a>
    </td></tr>
  `;
  try {
    await transporter.sendMail({
      from:    FROM(),
      to:      opts.to,
      subject: `${isUrgent ? "🔔 " : ""}${opts.title} — ${opts.businessName}`,
      html:    emailWrapper(content),
    });
    return true;
  } catch (err) {
    console.error("[sendAnnouncementEmail]", err);
    return false;
  }
}

export async function sendAnnouncementBatch(
  recipients: { email: string; name: string }[],
  opts: Omit<AnnouncementEmailOptions, "to" | "name">
): Promise<number> {
  let sent = 0;
  const CHUNK = 10;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    await Promise.allSettled(
      chunk.map((r) =>
        sendAnnouncementEmail({ ...opts, to: r.email, name: r.name }).then((ok) => { if (ok) sent++; })
      )
    );
  }
  return sent;
}
