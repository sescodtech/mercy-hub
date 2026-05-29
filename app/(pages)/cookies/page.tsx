import Link from "next/link";

export const metadata = {
  title: "Cookies Policy — Mercy Home Essentials",
};

export default function CookiesPage() {
  const lastUpdated = "January 1, 2025";
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100 py-12 text-center">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Cookies Policy</h1>
        <p className="text-sm text-neutral-400 mt-2">Last updated: {lastUpdated}</p>
      </div>
      <div className="container-site py-16 max-w-3xl">
        <div className="bg-white rounded-2xl border border-neutral-100 p-8 md:p-12 prose prose-neutral max-w-none text-sm leading-relaxed">
          <h2>What are cookies?</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide personalized experiences.</p>

          <h2>How we use cookies</h2>
          <p>We use cookies for the following purposes:</p>
          <ul>
            <li><strong>Essential Cookies:</strong> Necessary for the website to function, such as managing your shopping cart and authentication sessions.</li>
            <li><strong>Analytical Cookies:</strong> Help us understand how visitors interact with our website, allowing us to improve the user experience.</li>
            <li><strong>Preference Cookies:</strong> Remember your settings, such as language or region preferences.</li>
          </ul>

          <h2>Managing your cookies</h2>
          <p>You can manage and disable cookies through your browser settings. However, please note that disabling essential cookies may affect the functionality of our website.</p>

          <h2>Contact Us</h2>
          <p>If you have any questions about our use of cookies, please <Link href="/contact" className="text-[#d98c2a]">contact us</Link>.</p>
        </div>
      </div>
    </div>
  );
}
