"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Instagram, Facebook, Twitter, Linkedin, Youtube,
  Mail, Phone, MapPin, ArrowRight,
} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  facebook:  Facebook,
  twitter:   Twitter,
  linkedin:  Linkedin,
  youtube:   Youtube,
};

// TikTok SVG (not in lucide)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.28 8.28 0 0 0 4.83 1.53V6.77a4.85 4.85 0 0 1-1.06-.08z" />
    </svg>
  );
}

export function Footer() {
  const { settings } = useSettings();

  const footerLogo  = settings?.logos?.footer || settings?.logos?.desktop || settings?.logo || "";
  const brandName   = settings?.businessName || "MercyHome Essentials";
  const description = settings?.footer?.description || settings?.about || "";
  const copyright   = settings?.footer?.copyright || `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`;
  const footerLinks = settings?.footer?.links ?? [];
  const social      = settings?.social ?? {};
  const whatsapp    = settings?.whatsapp || "";
  const email       = settings?.email || "";
  const phone       = settings?.phone?.[0] || "";
  const address     = settings?.address;

  const socialLinks: { key: string; url: string; Icon: React.ElementType }[] = [
    ...Object.entries(SOCIAL_ICONS)
      .filter(([key]) => social[key as keyof typeof social])
      .map(([key, Icon]) => ({ key, url: social[key as keyof typeof social] as string, Icon })),
    ...(social.tiktok ? [{ key: "tiktok", url: social.tiktok, Icon: TikTokIcon }] : []),
  ];

  return (
    <footer style={{ backgroundColor: "var(--color-footer-bg)", color: "rgba(255,255,255,0.6)" }}>
      <div className="container-site py-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand column */}
        <div className="lg:col-span-2 space-y-5">
          <Link href="/">
            {footerLogo ? (
              <Image
                src={footerLogo}
                alt={brandName}
                height={48}
                width={180}
                className="h-12 w-auto object-contain brightness-200"
              />
            ) : (
              <span className="font-display text-2xl font-semibold text-white">
                {brandName.split(" ").slice(0, -1).join(" ")}{" "}
                <span style={{ color: "var(--color-brand-primary)" }}>
                  {brandName.split(" ").slice(-1)[0]}
                </span>
              </span>
            )}
          </Link>

          {description && (
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {description}
            </p>
          )}

          {/* Social icons */}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3">
              {socialLinks.map(({ key, url, Icon }) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={key}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-brand-primary)";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "";
                  }}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Quick Links</h3>
          <ul className="space-y-2.5">
            {[
              { label: "Shop All",    href: "/shop" },
              { label: "New Arrivals",href: "/shop?filter=new" },
              { label: "Sale",        href: "/shop?filter=sale" },
              { label: "About Us",    href: "/about" },
              { label: "Blog",        href: "/blog" },
              { label: "Contact",     href: "/contact" },
              { label: "Careers",     href: "/careers" },
              ...footerLinks.map(({ label, href }: { label: string; href: string }) => ({ label, href })),
            ].map(({ label, href }) => (
              <li key={href}>
                <Link href={href}
                  className="text-sm flex items-center gap-1.5 group transition-colors"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--color-brand-primary)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
                >
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-widest">Contact</h3>
          <ul className="space-y-3">
            {email && (
              <li>
                <a href={`mailto:${email}`}
                  className="text-sm flex items-start gap-2.5 transition-colors"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--color-brand-primary)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
                >
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {email}
                </a>
              </li>
            )}
            {phone && (
              <li>
                <a href={`tel:${phone}`}
                  className="text-sm flex items-start gap-2.5 transition-colors"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--color-brand-primary)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
                >
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {phone}
                </a>
              </li>
            )}
            {whatsapp && (
              <li>
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm flex items-start gap-2.5 transition-colors"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#25D366"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
                >
                  {/* WhatsApp icon */}
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp Us
                </a>
              </li>
            )}
            {address?.city && (
              <li className="text-sm flex items-start gap-2.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {[address.street, address.city, address.state, address.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </li>
            )}
          </ul>

          {/* Newsletter mini */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-white uppercase tracking-widest mb-2">Newsletter</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-3 py-2 text-sm rounded-lg outline-none text-neutral-900 placeholder:text-neutral-400"
                style={{ minWidth: 0 }}
              />
              <button type="submit" className="px-3 py-2 rounded-lg text-white text-sm transition-colors"
                style={{ backgroundColor: "var(--color-brand-primary)" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-brand-accent)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-brand-primary)"}
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="container-site py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {copyright}
          </p>
          <div className="flex items-center gap-5">
            {[
              { label: "Privacy Policy",    href: "/privacy" },
              { label: "Terms of Service",  href: "/terms" },
              { label: "Returns Policy",    href: "/returns" },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                className="text-xs transition-colors"
                style={{ color: "rgba(255,255,255,0.35)" }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "var(--color-brand-primary)"}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
