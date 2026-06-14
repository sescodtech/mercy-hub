"use client";

import Link from "next/link";
import { Instagram, Twitter, Facebook, Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

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
    { label: "FAQ",            href: "/faq" },
    { label: "Returns",        href: "/returns" },
    { label: "Shipping Info",  href: "/shipping" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

const SOCIAL_ICONS: Record<string, any> = {
  instagram: Instagram, twitter: Twitter, facebook: Facebook,
  youtube: Youtube, linkedin: Linkedin,
};

export function Footer() {
  const { settings } = useSettings();

  const businessName  = settings?.businessName || "Mercy Home Essentials";
  const description   = settings?.footer?.description || "Premium home essentials for discerning tastes. Curated quality, delivered to your door.";
  const copyright     = settings?.footer?.copyright || `© ${new Date().getFullYear()} ${businessName}. All rights reserved.`;
  const email         = settings?.email || "hello@mercyhomeessentials.com";
  const phone         = settings?.phone?.[0] || "+234 903 424 0648";
  const address       = settings?.address ? `${settings.address.city || "Lagos"}, ${settings.address.country || "Nigeria"}` : "Lagos, Nigeria";
  const social        = settings?.social || {};

  const activeSocial = Object.entries(social).filter(([, url]) => url).map(([key, url]) => ({
    key, url: url as string, Icon: SOCIAL_ICONS[key],
  })).filter(({ Icon }) => Icon);

  return (
    <footer
      className="text-cream/80"
      style={{ backgroundColor: "var(--color-footer-bg, #1a1208)" }}
    >
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container-site py-14">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h3 className="font-display text-2xl font-semibold text-cream mb-2">Join the {businessName.split(" ")[0]} Family</h3>
              <p className="text-sm text-cream/60">Get 10% off your first order and early access to new arrivals.</p>
            </div>
            <form className="flex w-full max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email"
                className="flex-1 rounded-sm bg-white/10 border border-white/20 px-4 py-3 text-sm text-cream placeholder-cream/40 outline-none focus:border-brand-400 transition-colors" />
              <button type="submit" className="btn-primary flex-shrink-0 py-3">Subscribe</button>
            </form>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="container-site py-16">
        <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-10">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="group block mb-6">
              {settings?.logo ? (
                <img src={settings.logo} alt={businessName} className="h-10 w-auto object-contain brightness-0 invert" />
              ) : (
                <>
                  <span className="font-display text-2xl font-semibold text-cream tracking-tight">
                    {businessName.split(" ")[0]}<span style={{ color: "var(--color-brand-primary, #d98c2a)" }}>{businessName.split(" ").slice(1, 2).join(" ")}</span>
                  </span>
                  <span className="block text-[9px] tracking-[0.3em] uppercase text-cream/40 -mt-1">
                    {businessName.split(" ").slice(2).join(" ") || "Essentials"}
                  </span>
                </>
              )}
            </Link>
            <p className="text-sm text-cream/50 leading-relaxed mb-6">{description}</p>
            {activeSocial.length > 0 && (
              <div className="flex gap-3">
                {activeSocial.map(({ key, url, Icon }) => (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={key}
                    className="w-9 h-9 rounded-sm border border-white/15 flex items-center justify-center text-cream/50 hover:text-white transition-all duration-200"
                    style={{ "--hover-bg": "var(--color-brand-primary, #d98c2a)" } as any}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--color-brand-primary, #d98c2a)";
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-brand-primary, #d98c2a)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "";
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = "";
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold tracking-[0.2em] uppercase text-cream/90 mb-5">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream/50 transition-colors"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-brand-primary, #d98c2a)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = ""; }}
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
            { Icon: MapPin, text: address },
            { Icon: Phone,  text: phone },
            { Icon: Mail,   text: email },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-cream/50">
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-brand-primary, #d98c2a)" }} />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="container-site py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-cream/30">
          <p>{copyright}</p>
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
