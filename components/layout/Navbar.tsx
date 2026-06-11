"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, Heart, User, Menu, X, ChevronDown, Package, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/hooks/useCart";
import { useWishlistStore } from "@/hooks/useWishlist";
import { useSettings } from "@/hooks/useSettings";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { cn } from "@/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop", children: [
    { label: "All Products",  href: "/shop" },
    { label: "Bedding",       href: "/shop?category=bedding" },
    { label: "Kitchenware",   href: "/shop?category=kitchenware" },
    { label: "Home Decor",    href: "/shop?category=home-decor" },
    { label: "Bath & Body",   href: "/shop?category=bath-body" },
    { label: "New Arrivals",  href: "/shop?filter=new" },
    { label: "Sale",          href: "/shop?filter=sale" },
  ]},
  { label: "Blog",    href: "/blog" },
  { label: "About",   href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { settings } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const cartCount    = useCartStore((s) => s.getItemCount());
  const openCart     = useCartStore((s) => s.openCart);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const announcement = settings?.announcement;
  const showAnnouncement = announcement?.enabled !== false;
  const announcementText = announcement?.text ||
    (settings?.shipping?.freeShippingEnabled
      ? `Free shipping on orders over ₦${(settings?.shipping?.freeShippingThreshold ?? 50000).toLocaleString()} · Quality you can trust`
      : "Quality you can trust · Premium Home Essentials");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setActiveDropdown(null); }, [pathname]);
  useEffect(() => { if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100); }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
    }
  };

  return (
    <>
      {showAnnouncement && (
        <div className="text-xs tracking-widest uppercase py-2 text-center font-body"
          style={{ backgroundColor: announcement?.bgColor || "#1a1108", color: announcement?.textColor || "#f5f0e8cc" }}>
          {announcementText}
        </div>
      )}

      <header className={cn("sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "bg-white/95 backdrop-blur-md shadow-[0_1px_20px_rgba(0,0,0,0.08)]" : "bg-cream/95 backdrop-blur-sm")}>
        <div className="container-site">
          <div className="flex h-16 items-center justify-between gap-4">

            <Link href="/" className="flex-shrink-0 group">
              {settings?.logo ? (
                <img src={settings.logo} alt={settings.businessName || "Mercy Home Essentials"}
                  className="h-10 w-auto object-contain" />
              ) : (
                <>
                  <span className="font-display text-2xl font-semibold text-ebony tracking-tight group-hover:text-brand-600 transition-colors">
                    Mercy<span className="text-brand-500">Home</span>
                  </span>
                  <span className="block text-[9px] tracking-[0.3em] uppercase text-neutral-400 font-body -mt-1">Essentials</span>
                </>
              )}
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.href} className="relative"
                  onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}>
                  <Link href={link.href} className={cn(
                    "flex items-center gap-1 px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-200 rounded-sm",
                    pathname === link.href ? "text-brand-600" : "text-neutral-700 hover:text-brand-600")}>
                    {link.label}
                    {link.children && <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", activeDropdown === link.label && "rotate-180")} />}
                  </Link>
                  <AnimatePresence>
                    {link.children && activeDropdown === link.label && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-52 rounded-lg bg-white border border-neutral-100 shadow-luxury overflow-hidden">
                        {link.children.map((child) => (
                          <Link key={child.href} href={child.href}
                            className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              <button onClick={() => setSearchOpen(true)} className="btn-icon" aria-label="Search"><Search className="w-5 h-5" /></button>
              <Link href="/dashboard/wishlist" className="btn-icon relative" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-medium">{wishlistCount > 9 ? "9+" : wishlistCount}</span>}
              </Link>
              <NotificationBell />
              <button onClick={openCart} className="btn-icon relative" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && <motion.span key={cartCount} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-medium">
                  {cartCount > 9 ? "9+" : cartCount}
                </motion.span>}
              </button>
              {session ? (
                <div className="relative group hidden lg:block">
                  <button className="btn-icon"><User className="w-5 h-5" /></button>
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-white border border-neutral-100 shadow-luxury overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="px-4 py-3 border-b border-neutral-100">
                      <p className="text-sm font-medium text-neutral-900 truncate">{session.user?.name}</p>
                      <p className="text-xs text-neutral-400 truncate">{session.user?.email}</p>
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
                    <Link href="/dashboard/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"><Package className="w-4 h-4" /> Orders</Link>
                    {session.user?.role === "admin" && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50"><Settings className="w-4 h-4" /> Admin Panel</Link>
                    )}
                    <button onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-neutral-100">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/auth/login" className="hidden lg:flex btn-primary py-2 px-4 text-xs">Sign In</Link>
              )}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-icon lg:hidden" aria-label="Menu">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }} className="lg:hidden overflow-hidden border-t border-neutral-100 bg-white">
              <div className="container-site py-4 space-y-1">
                {navLinks.map((link) => (
                  <div key={link.href}>
                    <Link href={link.href} className="block px-3 py-2.5 text-sm font-medium text-neutral-700 rounded-md hover:bg-neutral-50">{link.label}</Link>
                    {link.children && (
                      <div className="ml-4 mt-1 space-y-1">
                        {link.children.map((child) => (
                          <Link key={child.href} href={child.href} className="block px-3 py-2 text-sm text-neutral-500 rounded-md hover:bg-neutral-50">{child.label}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="pt-4 border-t border-neutral-100">
                  {session ? (
                    <>
                      <Link href="/dashboard" className="block px-3 py-2.5 text-sm text-neutral-700">Dashboard</Link>
                      <button onClick={() => signOut()} className="block w-full text-left px-3 py-2.5 text-sm text-red-600">Sign Out</button>
                    </>
                  ) : (
                    <Link href="/auth/login" className="btn-primary w-full justify-center">Sign In</Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24"
            onClick={() => setSearchOpen(false)}>
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products…"
                  className="w-full pl-12 pr-4 py-5 rounded-xl bg-white text-lg text-neutral-900 placeholder-neutral-400 outline-none shadow-luxury" />
                <button type="button" onClick={() => setSearchOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
