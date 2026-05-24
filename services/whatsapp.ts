// ─── WhatsApp Notification Service ──────────────────────────
// Uses Twilio WhatsApp API (sandbox or production)
// Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM in .env.local

interface OrderNotificationData {
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  status?: string;
}

function formatPhone(phone: string): string {
  // Ensure phone has country code
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "234" + cleaned.slice(1); // Nigeria code
  }
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return `whatsapp:${cleaned}`;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const from       = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    console.log("WhatsApp: Twilio credentials not configured");
    console.log("Message that would be sent:", message);
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          From: from,
          To:   formatPhone(to),
          Body: message,
        }),
      }
    );

    const data = await response.json();
    if (data.sid) {
      console.log("WhatsApp sent successfully:", data.sid);
      return true;
    }
    console.error("WhatsApp send failed:", data);
    return false;
  } catch (error) {
    console.error("WhatsApp error:", error);
    return false;
  }
}

export async function sendOrderConfirmation(data: OrderNotificationData): Promise<boolean> {
  const itemsList = data.items
    .map((i) => `• ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
    .join("\n");

  const message = `
🛍️ *Order Confirmed — Mercy Home Essentials*

Hello ${data.customerName}! Your order has been received.

*Order #:* ${data.orderNumber}
*Items:*
${itemsList}

*Total: ${formatPrice(data.total)}*

We'll notify you when your order ships. Thank you for shopping with us! 🏠✨

_Reply STOP to unsubscribe_
  `.trim();

  return sendWhatsApp(data.customerPhone, message);
}

export async function sendOrderStatusUpdate(data: OrderNotificationData): Promise<boolean> {
  const statusMessages: Record<string, string> = {
    confirmed:  "✅ Your order has been *confirmed* and is being prepared.",
    processing: "⚙️ Your order is being *processed* and packed.",
    shipped:    "🚚 Your order has been *shipped* and is on its way!",
    delivered:  "🎉 Your order has been *delivered*! Enjoy your purchase.",
    cancelled:  "❌ Your order has been *cancelled*. Contact us for support.",
  };

  const statusMsg = statusMessages[data.status ?? ""] || `Your order status is now: ${data.status}`;

  const message = `
📦 *Order Update — Mercy Home Essentials*

Hello ${data.customerName}!

${statusMsg}

*Order #:* ${data.orderNumber}
*Total:* ${formatPrice(data.total)}

Visit mercy-hub.vercel.app/dashboard/orders to track your order.

_Reply STOP to unsubscribe_
  `.trim();

  return sendWhatsApp(data.customerPhone, message);
}

export async function sendLowStockAlert(
  adminPhone: string,
  productName: string,
  stock: number
): Promise<boolean> {
  const message = `
⚠️ *Low Stock Alert — Mercy Home Admin*

Product: *${productName}*
Remaining Stock: *${stock} units*

Please restock this item soon to avoid going out of stock.

Visit mercy-hub.vercel.app/admin/products to manage inventory.
  `.trim();

  return sendWhatsApp(adminPhone, message);
}
