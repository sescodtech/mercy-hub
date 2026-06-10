"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  BarChart3, Tag, Image as ImageIcon, Settings, X,
  FileText, Briefcase,
} from "lucide-react";
import { cn } from "@/utils";

export const NAV = [
  { icon: LayoutDashboard, label: "Overview",   href: "/admin" },
  { icon: Package,         label: "Products",   href: "/admin/products" },
  { icon: ShoppingCart,    label: "Orders",     href: "/admin/orders" },
  { icon: Users,           label: "Customers",  href: "/admin/customers" },
  { icon: BarChart3,       label: "Analytics",  href: "/admin/analytics" },
  { icon: Tag,             label: "Coupons",    href: "/admin/coupons" },
  { icon: ImageIcon,       label: "Banners",    href: "/admin/banners" },
  { icon: FileText,        label: "Blog",       href: "/admin/blog" },
  { icon: Briefcase,       label: "Careers",    href: "/admin/careers" },
  { icon: Settings,        label: "Settings",   href: "/admin/settings" },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ mobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-full",
        mobile ? "w-64" : "w-64 hidden lg:flex"
      )}
      style={{ backgroundColor: "#1a1208", color: "rgba(255,255,255,0.7)" }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/" className="block">
          <span style={{ fontFamily: "serif", fontSize: "1.25rem", fontWeight: 600, color: "white" }}>
            Mercy<span style={{ color: "#d98c2a" }}>Home</span>
          </span>
          <span style={{
            fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", display: "block", marginTop: "2px",
          }}>
            Admin Panel
          </span>
        </Link>
        {mobile && onClose && (
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ icon: Icon, label, href }) => {
          // Exact match for overview, prefix match for others
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                isActive ? "text-[#d98c2a]" : "hover:text-white"
              )}
              style={isActive ? { backgroundColor: "rgba(217,140,42,0.2)" } : {}}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <Link href="/" style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
          ← Back to Store
        </Link>
      </div>
    </aside>
  );
}
