import Link from "next/link";
import { Instagram, Twitter, Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  Shop: [
    { label: "All Products",  href: "/shop" },
    { label: "Bedding",       href: "/shop?category=bedding" },
    { label: "Kitchenware",   href: "/shop?category=kitchenware" },
    { label: "Home Decor",    href: "/shop?category=home-decor" },
    { label: "New Arrivals",  href: "/shop?filter=new" },
    { label: "Sale",          href: "/shop?filter=sale" },
  ],
  Account: [
    { label: "My Account",    href: "/dashboard" },
    { label: "Orders",        href: "/dashboard/orders" },
    { label: "Wishlist",      href: "/dashboard/wishlist" },
    { label: "Track Order",   href: "/dashboard/orders" },
  ],
  Company: [
    { label: "About Us",      href: "/about" },
    { label: "Contact",       href: "/contact" },
    { label: "Blog",          href: "/blog" },
    { label: "Careers",       href: "/careers" },
  ],
  Support: [
    { label: "FAQ",           href: "/faq" },
    { label: "Returns",       href: "/returns" },
    { label: "Shipping Info", href: "/shipping" },
    { label: "Privacy Policy",href: "/privacy" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-ebony text-cream/80">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container-site py-14">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-display text-2xl font-semibold text-cream mb-2">
                Join the Mercy Home Family
              </h3>
              <p className="text-sm text-cream/60">
                Get 10% off your first order and early access to new arrivals.
              </p>
            </div>
            <form className="flex w-full max-w-md gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-sm bg-white/10 border border-white/20 px-4 py-3 text-sm text-cream placeholder-cream/40 outline-none focus:border-brand-400 transition-colors"
              />
              <button type="submit" className="btn-primary flex-shrink-0 py-3">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Links grid */}
      <div className="container-site py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="block mb-4">
              <span className="font-display text-2xl font-semibold text-cream">
                Mercy<span className="text-brand-400">Home</span>
              </span>
              <span className="block text-[9px] tracking-[0.3em] uppercase text-cream/40 -mt-1">
                Essentials
              </span>
            </Link>
            <p className="text-sm text-cream/50 leading-relaxed mb-6">
              Premium home essentials for discerning tastes. Curated quality, delivered to your door.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, href: "#", label: "Instagram" },
                { Icon: Twitter,   href: "#", label: "Twitter" },
                { Icon: Facebook,  href: "#", label: "Facebook" },
                { Icon: Youtube,   href: "#", label: "YouTube" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-sm border border-white/15 flex items-center justify-center text-cream/50 hover:bg-brand-600 hover:border-brand-600 hover:text-white transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-cream/90 mb-5">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream/50 hover:text-brand-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div className="mt-14 pt-10 border-t border-white/10 grid sm:grid-cols-3 gap-6">
          {[
            { Icon: MapPin,  text: "Lagos, Nigeria" },
            { Icon: Phone,   text: "+234 903 424 0648" },
            { Icon: Mail,    text: "anuoluwapoayoola78@gmail.com" },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-cream/50">
              <Icon className="w-4 h-4 text-brand-500 flex-shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="container-site py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/30">
          <p>© {new Date().getFullYear()} Mercy Home Essentials. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-cream/60 transition-colors">Privacy</Link>
            <Link href="/terms"   className="hover:text-cream/60 transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-cream/60 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
