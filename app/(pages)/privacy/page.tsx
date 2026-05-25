import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Mercy Home Essentials",
};

export default function PrivacyPage() {
  const lastUpdated = "January 1, 2025";
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100 py-12 text-center">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Privacy Policy</h1>
        <p className="text-sm text-neutral-400 mt-2">Last updated: {lastUpdated}</p>
      </div>
      <div className="container-site py-16 max-w-3xl">
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-12 prose prose-neutral max-w-none text-sm leading-relaxed">
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you create an account, place an order, or contact us. This includes your name, email address, phone number, delivery address, and payment information.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to process orders, communicate with you about your orders, send promotional communications (with your consent), improve our services, and comply with legal obligations.</p>

          <h2>3. Information Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information with payment processors (Paystack, Flutterwave), delivery partners, and service providers who assist in our operations.</p>

          <h2>4. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

          <h2>5. Cookies</h2>
          <p>We use cookies to maintain your session, remember your preferences, and analyze website traffic. You can control cookie settings through your browser.</p>

          <h2>6. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at the details below.</p>

          <h2>7. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please <Link href="/contact" className="text-[#d98c2a]">contact us</Link>.</p>
        </div>
      </div>
    </div>
  );
}
