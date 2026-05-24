"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Bell, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useRealtimeOrders } from "@/hooks/useRealtime";
import { cn } from "@/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);

  const { notifications, unreadCount, markAllRead } = useRealtimeOrders({ interval: 30000 });

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden">
      {/* Desktop sidebar */}
      <AdminSidebar />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute left-0 top-0 h-full"
            >
              <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-3.5 flex items-center justify-between flex-shrink-0">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-neutral-100 text-neutral-500"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Spacer on desktop */}
          <div className="hidden lg:block" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-2xl border border-neutral-100 z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                      <h3 className="font-semibold text-sm text-neutral-900">
                        Notifications{" "}
                        {unreadCount > 0 && (
                          <span className="text-xs text-[#d98c2a]">({unreadCount} new)</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-[#d98c2a] hover:underline">
                            Mark all read
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)}>
                          <X className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-sm text-neutral-400">No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={cn(
                              "px-4 py-3 border-b border-neutral-50 text-sm",
                              !n.read && "bg-[#d98c2a]/5"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                !n.read ? "bg-[#d98c2a]" : "bg-neutral-300"
                              )} />
                              <div>
                                <p className="text-neutral-800 font-medium">{n.message}</p>
                                <p className="text-neutral-400 text-xs mt-0.5">
                                  {new Date(n.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 py-3 border-t border-neutral-100">
                      <Link href="/admin/orders" onClick={() => setNotifOpen(false)}
                        className="text-xs text-[#d98c2a] hover:underline">
                        View all orders →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/shop"
              className="hidden sm:flex items-center gap-1 text-xs text-[#d98c2a] px-3 py-1.5 border border-[#d98c2a]/30 rounded-lg hover:bg-[#d98c2a]/5 transition-colors">
              View Store →
            </Link>
          </div>
        </header>

        {/* Page content — scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
