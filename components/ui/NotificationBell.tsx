"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck, Info, CheckCircle, AlertTriangle, Wrench, Sparkles, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useNotifications, UserNotification } from "@/hooks/useNotifications";
import { cn } from "@/utils";

const TYPE_CONFIG = {
  info:        { Icon: Info,          color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-200"   },
  success:     { Icon: CheckCircle,   color: "text-green-500",  bg: "bg-green-50",  border: "border-green-200"  },
  warning:     { Icon: AlertTriangle, color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-200"  },
  maintenance: { Icon: Wrench,        color: "text-rose-500",   bg: "bg-rose-50",   border: "border-rose-200"   },
  update:      { Icon: Sparkles,      color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
};

function NotifItem({ n, onRead }: { n: UserNotification; onRead: (id: string) => void }) {
  const cfg = TYPE_CONFIG[n.announcement.type] ?? TYPE_CONFIG.info;
  const { Icon } = cfg;
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    setExpanded(!expanded);
    if (!n.isRead) onRead(n._id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "px-4 py-3.5 border-b border-neutral-50 cursor-pointer transition-colors hover:bg-neutral-50",
        !n.isRead && "bg-[#d98c2a]/5"
      )}
    >
      <div className="flex gap-3 items-start">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
          <Icon className={cn("w-4 h-4", cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm font-medium text-neutral-900 leading-snug", !n.isRead && "font-semibold")}>
              {n.announcement.title}
            </p>
            {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#d98c2a] flex-shrink-0 mt-1.5" />}
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-neutral-500 leading-relaxed mt-1 overflow-hidden"
              >
                {n.announcement.body}
              </motion.p>
            )}
          </AnimatePresence>
          {!expanded && (
            <p className="text-xs text-neutral-400 mt-0.5 truncate">{n.announcement.body}</p>
          )}
          <p className="text-[10px] text-neutral-300 mt-1.5">
            {new Date(n.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Not logged in → nothing
  if (!session) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-icon relative"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#d98c2a] text-white text-[10px] flex items-center justify-center font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-neutral-100 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-neutral-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#d98c2a] text-white text-[10px] rounded-full font-bold">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[#d98c2a] hover:underline flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> All read
                  </button>
                )}
                <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-neutral-400" /></button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-8 h-8 text-neutral-200 mx-auto mb-3" />
                  <p className="text-sm text-neutral-400">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <NotifItem key={n._id} n={n} onRead={markRead} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
