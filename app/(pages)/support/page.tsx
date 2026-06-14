import Link from "next/link";
import {
  ShoppingBag, Truck, CreditCard,
  MessageCircle, Mail, Phone, FileText, ChevronRight,
} from "lucide-react";

const TOPICS = [
  { icon: ShoppingBag, title: "Orders",           desc: "Track, modify or cancel your orders",   href: "/faq#Orders" },
  { icon: Truck,       title: "Shipping",          desc: "Delivery times, areas and tracking",    href: "/faq#Shipping" },
  { icon: CreditCard,  title: "Payments",          desc: "Payment methods and security",          href: "/faq#Orders" },
];

const POLICIES = [
  { title: "Privacy Policy",    href: "/privacy" },
  { title: "Terms of Service",  href: "/terms" },
  { title: "Shipping Policy",   href: "/shipping-policy" },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-white border-b border-neutral-100 py-16 text-center">
        <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-3">Help Center</h1>
        <p className="text-neutral-500 max-w-md mx-auto">
          Browse help topics or get in touch with our support team.
        </p>
      </div>

      <div className="container-site py-16 max-w-5xl space-y-16">

        {/* Help Topics */}
        <div>
          <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-6">Browse Help Topics</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TOPICS.map(({ icon: Icon, title, desc, href }) => (
              <Link key={title} href={href}
                className="bg-white rounded-2xl border border-neutral-100 p-6 hover:border-[#d98c2a]/30 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 bg-[#d98c2a]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#d98c2a]/20 transition-colors">
                  <Icon className="w-5 h-5 text-[#d98c2a]" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* FAQ */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-sm text-neutral-500 mb-5">
              Find quick answers to the most common questions about shopping with us.
            </p>
            <Link href="/faq"
              className="flex items-center gap-2 text-sm font-medium text-[#d98c2a] hover:text-[#c47020] transition-colors">
              Browse all FAQs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Policies */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <h2 className="font-semibold text-neutral-900 mb-4">Legal & Policies</h2>
            <div className="space-y-2">
              {POLICIES.map(({ title, href }) => (
                <Link key={title} href={href}
                  className="flex items-center justify-between py-2 text-sm text-neutral-600 hover:text-[#d98c2a] border-b border-neutral-50 last:border-0 transition-colors">
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />{title}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Contact options */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-8">
          <h2 className="font-display text-xl font-semibold text-neutral-900 mb-2 text-center">Still need help?</h2>
          <p className="text-neutral-500 text-sm text-center mb-8">Our support team is available Mon–Fri 9am–6pm</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: MessageCircle, title: "WhatsApp",  sub: "Fastest response", href: "/contact", color: "text-green-600", bg: "bg-green-50" },
              { icon: Mail,          title: "Email",     sub: "Within 24 hours",  href: "/contact", color: "text-blue-600",  bg: "bg-blue-50" },
              { icon: Phone,         title: "Call Us",   sub: "Mon–Fri 9am–6pm",  href: "/contact", color: "text-[#d98c2a]", bg: "bg-[#d98c2a]/10" },
            ].map(({ icon: Icon, title, sub, href, color, bg }) => (
              <Link key={title} href={href}
                className="flex flex-col items-center text-center p-5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <p className="font-semibold text-neutral-900 text-sm">{title}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
