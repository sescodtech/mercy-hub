"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu, X, Search, ShoppingBag, Heart, User, ChevronDown,
} from "lucide-react";
import { useCartStore } from "@/hooks/useCart";
import { useWishlistStore } from "@/hooks/useWishlist";
import { useSettings } from "@/hooks/useSettings";
import { useSession } from "next-auth/react";
import { cn } from "@/utils";

const NAV_LINKS = [
  { label: "Shop",         href: "/shop" },
  { label: "New Arrivals", href: "/shop?filter=new" },
  { label: "Sale",         href: "/shop?filter=sale" },
  { label: "About",        href: "/about" },
  { label: "Contact",      href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ,    setSearchQ]    = useState("");

  const itemCount  = useCartStore((s) => s.getItemCount());
  const openCart   = useCartStore((s) => s.openCart);
  const wishlistN  = useWishlistStore((s) => s.items.length);
  const { data: session } = useSession();
  const { settings, loading: settingsLoading } = useSettings();

  // Logos from Settings — falls back to text logo
  const desktopLogo = settings?.logos?.desktop || settings?.logo || "";
  const mobileLogo  = settings?.logos?.mobile  || desktopLogo || "";
  const brandName   = settings?.businessName   || "MercyHome";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else            document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQ.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQ.trim())}`;
    }
  };

  const isActive = (href: string) => {
    return href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled ? "shadow-sm" : ""
        )}
        style={{ backgroundColor: "var(--color-header-bg)" }}
      >
        {/* ── Desktop nav ── */}
        <div className="container-site">
          <div className="flex items-center justify-between h-16 sm:h-18">

            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0 hover:opacity-80 transition-opacity">
              {!settingsLoading && desktopLogo ? (
                <>
                  {/* Desktop logo */}
                  <div className="hidden sm:block relative h-10 w-auto">
                    <Image
                      src={desktopLogo}
                      alt={brandName}
                      height={40}
                      width={160}
                      className="h-10 w-auto object-contain"
                      priority
                    />
                  </div>
                  {/* Mobile logo */}
                  <div className="sm:hidden relative h-9 w-auto">
                    <Image
                      src={mobileLogo}
                      alt={brandName}
                      height={36}
                      width={120}
                      className="h-9 w-auto object-contain"
                      priority
                    />
                  </div>
                </>
              ) : (
                /* Text fallback */
                <span className="font-display text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {brandName.split(" ").map((word, i) => (
                    <span key={i}>
                      {i === 0
                        ? word
                        : <span style={{ color: "var(--color-brand-primary)" }}>{word}</span>}
                      {i < brandName.split(" ").length - 1 ? " " : ""}
                    </span>
                  ))}
                </span>
              )}
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ label, href }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium tracking-wide transition-all duration-200 group",
                      active
                        ? "text-brand-primary"
                        : "text-text-secondary hover:text-text-primary"
                    )}
                    style={{
                      color: active
                        ? "var(--color-brand-primary)"
                        : "var(--color-nav-text, var(--color-text-secondary))",
                    }}
                  >
                    {label}
                    {/* Active indicator line */}
                    {active && (
                      <span
                        className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full transition-all duration-200"
                        style={{ backgroundColor: "var(--color-brand-primary)" }}
                      />
                    )}
                    {/* Hover line for inactive items */}
                    {!active && (
                      <span
                        className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full transition-all duration-200 scale-x-0 group-hover:scale-x-100 origin-left"
                        style={{ backgroundColor: "var(--color-brand-primary)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-lg hover:bg-neutral-100/80 transition-colors duration-200 group"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Search"
              >
                <Search className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2.5 rounded-lg hover:bg-neutral-100/80 transition-colors duration-200 hidden sm:flex group"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                {wishlistN > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: "var(--color-brand-primary)" }}
                  >
                    {wishlistN > 9 ? "9+" : wishlistN}
                  </span>
                )}
              </Link>

              {/* Account */}
              <Link
                href={session ? "/dashboard" : "/auth/login"}
                className="relative p-2.5 rounded-lg hover:bg-neutral-100/80 transition-colors duration-200 hidden sm:flex group"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Account"
              >
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    width={20} height={20}
                    className="rounded-full w-5 h-5 object-cover group-hover:ring-2 ring-brand-primary/30 transition-all duration-200"
                  />
                ) : (
                  <User className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative p-2.5 rounded-lg hover:bg-neutral-100/80 transition-colors duration-200 flex items-center gap-1.5 group"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Open cart"
              >
                <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                {itemCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: "var(--color-brand-primary)" }}
                  >
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 rounded-lg hover:bg-neutral-100/80 transition-colors duration-200 ml-0.5"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search bar */}
          {searchOpen && (
            <div className="pb-4 border-t border-neutral-100 pt-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  autoFocus
                  type="search"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search for products…"
                  className="form-input flex-1"
                />
                <button type="submit" className="btn-primary px-5 py-2.5 text-sm">
                  Search
                </button>
                <button type="button" onClick={() => setSearchOpen(false)}
                  className="p-2.5 border border-neutral-200 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors duration-200">
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300" onClick={() => setMobileOpen(false)} />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 flex flex-col shadow-2xl"
            style={{ backgroundColor: "var(--color-header-bg)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-5 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <Link href="/" onClick={() => setMobileOpen(false)} className="hover:opacity-80 transition-opacity">
                {desktopLogo ? (
                  <Image src={desktopLogo} alt={brandName} height={32} width={120} className="h-8 w-auto object-contain" />
                ) : (
                  <span className="font-display text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {brandName}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => setMobileOpen(false)} 
                style={{ color: "var(--color-text-secondary)" }}
                className="p-2 hover:bg-neutral-100/50 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto scrollbar-thin">
              {NAV_LINKS.map(({ label, href }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 rounded-lg text-sm font-medium transition-all duration-200",
                      active
                        ? "text-brand-primary"
                        : "text-text-primary hover:bg-neutral-100/50"
                    )}
                    style={{
                      color: active
                        ? "var(--color-brand-primary)"
                        : "var(--color-text-primary)",
                      backgroundColor: active
                        ? "color-mix(in srgb, var(--color-brand-primary) 10%, transparent)"
                        : "transparent",
                    }}
                  >
                    <span>{label}</span>
                    {active && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--color-brand-primary)" }} />}
                  </Link>
                );
              })}
            </nav>

            <div className="px-4 py-5 space-y-3 border-t" style={{ borderColor: "var(--color-border)" }}>
              <Link href={session ? "/dashboard" : "/auth/login"} onClick={() => setMobileOpen(false)}
                className="btn-secondary w-full justify-center text-sm hover:shadow-sm transition-all duration-200">
                {session ? "My Account" : "Sign In"}
              </Link>
              <Link href="/shop" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center text-sm hover:shadow-md transition-all duration-200">
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
