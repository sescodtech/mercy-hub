import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Mercy Home Essentials",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100 py-12 text-center">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Terms of Service</h1>
        <p className="text-sm text-neutral-400 mt-2">Last updated: January 1, 2025</p>
      </div>
      <div className="container-site py-16 max-w-3xl">
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-12 prose prose-neutral max-w-none text-sm leading-relaxed">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using Mercy Home Essentials, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>

          <h2>2. Products and Pricing</h2>
          <p>We reserve the right to modify prices at any time. All prices are in Nigerian Naira (₦). We make every effort to display product colors and descriptions accurately, but cannot guarantee accuracy on all screens.</p>

          <h2>3. Orders and Payment</h2>
          <p>By placing an order, you confirm that all information provided is accurate. We reserve the right to cancel orders in cases of pricing errors or stock unavailability. Payment must be completed before order processing begins.</p>

          <h2>4. Shipping and Delivery</h2>
          <p>Delivery times are estimates and not guarantees. We are not responsible for delays caused by third-party couriers or circumstances beyond our control.</p>

          <h2>5. Returns and Refunds</h2>
          <p>All purchases are final. Please contact our support team for any concerns regarding your order.</p>

          <h2>6. Intellectual Property</h2>
          <p>All content on this website including text, graphics, logos, and images is the property of Mercy Home Essentials and protected by Nigerian and international copyright laws.</p>

          <h2>7. Limitation of Liability</h2>
          <p>Mercy Home Essentials shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>

          <h2>8. Contact</h2>
          <p>For questions about these terms, please <Link href="/contact" className="text-[#d98c2a]">contact us</Link>.</p>
        </div>
      </div>
    </div>
  );
}
