"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Search, Heart, User, Menu, X,
  ChevronDown, Package, LogOut, Settings, LayoutDashboard,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/hooks/useCart";
import { useWishlistStore } from "@/hooks/useWishlist";
import { useSettings } from "@/hooks/useSettings";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { cn } from "@/utils";

const NAV_LINKS = [
  {
    label: "Shop", href: "/shop",
    children: [
      { label: "All Products",  href: "/shop" },
      { label: "Bedding",       href: "/shop?category=bedding" },
      { label: "Kitchenware",   href: "/shop?category=kitchenware" },
      { label: "Home Decor",    href: "/shop?category=home-decor" },
      { label: "Bath & Body",   href: "/shop?category=bath-body" },
      { label: "New Arrivals",  href: "/shop?filter=new" },
      { label: "Sale",          href: "/shop?filter=sale" },
    ],
  },
  { label: "New Arrivals", href: "/shop?filter=new" },
  { label: "Blog",         href: "/blog" },
  { label: "About",        href: "/about" },
  { label: "Contact",      href: "/contact" },
];

export function Navbar() {
  const pathname   = usePathname();
  const { data: session } = useSession();
  const { settings } = useSettings();

  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const cartCount     = useCartStore((s) => s.getItemCount());
  const openCart      = useCartStore((s) => s.openCart);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const announcement     = settings?.announcement;
  const showAnnouncement = announcement?.enabled !== false;
  const announcementText = announcement?.text ||
    (settings?.shipping?.freeShippingEnabled
      ? `Free delivery on orders over ₦${(settings?.shipping?.freeShippingThreshold ?? 100000).toLocaleString()} · Quality you can trust`
      : "Quality you can trust · Premium Home Essentials");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
    }
  };

  const logo    = settings?.logos?.desktop || settings?.logo;
  const bizName = settings?.businessName || "MercyHome";

  return (
    <>
      {/* ── Announcement bar ── */}
      {showAnnouncement && (
        <div
          className="text-xs py-2 text-center font-medium tracking-wide"
          style={{
            backgroundColor: announcement?.bgColor  || "#1a1108",
            color:           announcement?.textColor || "#f5f0e8cc",
          }}
        >
          {announcementText}
        </div>
      )}

      {/* ── Main header ── */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200",
          scrolled
            ? "bg-white/98 backdrop-blur-md shadow-sm border-b border-neutral-100"
            : "bg-[#fdf8f0]/98 backdrop-blur-sm"
        )}
      >
        <div className="container-site">
          <div className="flex h-14 items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              {logo ? (
                <img
                  src={logo}
                  alt={bizName}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div>
                  <span className="font-display text-xl font-semibold text-neutral-900 tracking-tight">
                    Mercy<span className="text-[#d98c2a]">Home</span>
                  </span>
                </div>
              )}
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden lg:flex items-center gap-0">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href.split("?")[0]);
                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-colors duration-150 rounded-md",
                        isActive
                          ? "text-[#d98c2a]"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/60"
                      )}
                    >
                      {link.label}
                      {link.children && (
                        <ChevronDown
                          className={cn(
                            "w-3.5 h-3.5 transition-transform duration-200 opacity-60",
                            activeDropdown === link.label && "rotate-180"
                          )}
                        />
                      )}
                    </Link>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {link.children && activeDropdown === link.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="absolute top-full left-0 mt-1 w-52 rounded-xl bg-white border border-neutral-100 shadow-lg overflow-hidden"
                        >
                          {link.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="flex items-center px-4 py-2.5 text-sm text-neutral-600 hover:bg-[#fdf8f0] hover:text-[#d98c2a] transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* ── Right actions ── */}
            <div className="flex items-center gap-0.5">

              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="Search"
              >
                <Search className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              </button>

              {/* Wishlist */}
              <Link
                href="/dashboard/wishlist"
                className="relative w-9 h-9 flex items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="Wishlist"
              >
                <Heart style={{ width: 18, height: 18 }} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#d98c2a] text-white text-[9px] flex items-center justify-center font-bold">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Notifications */}
              <NotificationBell />

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative w-9 h-9 flex items-center justify-center rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag style={{ width: 18, height: 18 }} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#d98c2a] text-white text-[9px] flex items-center justify-center font-bold"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </motion.span>
                )}
              </button>

              {/* Account dropdown */}
              {session ? (
                <div className="relative group hidden lg:block ml-1">
                  <button className="flex items-center gap-1.5 pl-2 pr-3 h-8 rounded-full border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 transition-colors text-sm">
                    <div className="w-5 h-5 rounded-full bg-[#d98c2a] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {session.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium max-w-[80px] truncate">
                      {session.user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white border border-neutral-100 shadow-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                    <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{session.user?.name}</p>
                      <p className="text-xs text-neutral-400 truncate">{session.user?.email}</p>
                    </div>
                    <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/dashboard/orders" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    {(session.user as any)?.role === "admin" && (
                      <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#d98c2a] hover:bg-[#fdf3e7] transition-colors border-t border-neutral-100">
                        <Settings className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-neutral-100"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden lg:flex items-center gap-1.5 ml-1 px-3.5 h-8 text-xs font-semibold rounded-full bg-[#d98c2a] text-white hover:bg-[#c47020] transition-colors"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors ml-1"
                aria-label="Menu"
              >
                {mobileOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-xl flex flex-col"
            >
              {/* Mobile header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-neutral-100">
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  {logo ? (
                    <img src={logo} alt={bizName} className="h-7 w-auto" />
                  ) : (
                    <span className="font-display text-lg font-semibold">
                      Mercy<span className="text-[#d98c2a]">Home</span>
                    </span>
                  )}
                </Link>
                <button onClick={() => setMobileOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-100">
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              {/* Mobile links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                {/* Shop with nested */}
                <div>
                  <button
                    onClick={() => setMobileShopOpen(!mobileShopOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-neutral-700 rounded-lg hover:bg-neutral-50"
                  >
                    Shop
                    <ChevronDown className={cn("w-4 h-4 transition-transform text-neutral-400", mobileShopOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {mobileShopOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-3 border-l border-neutral-100 pl-3 mt-1"
                      >
                        {NAV_LINKS[0].children!.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-2 py-2 text-sm text-neutral-500 hover:text-[#d98c2a] rounded-md"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {NAV_LINKS.slice(1).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mt-0.5",
                      pathname.startsWith(link.href.split("?")[0])
                        ? "bg-[#fdf3e7] text-[#d98c2a]"
                        : "text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile footer */}
              <div className="px-4 py-4 border-t border-neutral-100 space-y-2">
                {session ? (
                  <>
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-700 rounded-lg hover:bg-neutral-50">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/dashboard/orders" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-700 rounded-lg hover:bg-neutral-50">
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    {(session.user as any)?.role === "admin" && (
                      <Link href="/admin" onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#d98c2a] rounded-lg hover:bg-[#fdf3e7]">
                        <Settings className="w-4 h-4" /> Admin Panel
                      </Link>
                    )}
                    <button onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 rounded-lg hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center py-2.5 text-sm font-medium border border-neutral-200 rounded-lg text-neutral-700 hover:border-[#d98c2a] hover:text-[#d98c2a]">
                      Sign In
                    </Link>
                    <Link href="/auth/register" onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center py-2.5 text-sm font-medium rounded-lg bg-[#d98c2a] text-white hover:bg-[#c47020]">
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Search overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              className="w-full max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products…"
                  className="w-full pl-12 pr-12 py-4 rounded-xl bg-white text-base text-neutral-900 placeholder-neutral-400 outline-none shadow-xl border border-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
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
