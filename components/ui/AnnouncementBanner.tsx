"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, CheckCircle, AlertTriangle, Wrench, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useNotifications, UserNotification } from "@/hooks/useNotifications";
import { useSession } from "next-auth/react";
import { cn } from "@/utils";

const TYPE_CONFIG = {
  info:        { Icon: Info,          bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-800",   icon: "text-blue-500"   },
  success:     { Icon: CheckCircle,   bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  icon: "text-green-500"  },
  warning:     { Icon: AlertTriangle, bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  icon: "text-amber-500"  },
  maintenance: { Icon: Wrench,        bg: "bg-rose-50",   border: "border-rose-200",   text: "text-rose-800",   icon: "text-rose-500"   },
  update:      { Icon: Sparkles,      bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", icon: "text-purple-500" },
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "URGENT",
  high:   "IMPORTANT",
};

function Banner({ n, onDismiss }: { n: UserNotification; onDismiss: (id: string) => void }) {
  const cfg = TYPE_CONFIG[n.announcement.type] ?? TYPE_CONFIG.info;
  const { Icon } = cfg;
  const [expanded, setExpanded] = useState(false);
  const priorityLabel = PRIORITY_LABEL[n.announcement.priority];

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("border-b", cfg.bg, cfg.border)}
    >
      <div className="container-site py-3">
        <div className="flex items-start gap-3">
          <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", cfg.icon)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {priorityLabel && (
                <span className={cn("text-[10px] font-bold tracking-widest uppercase", cfg.text)}>
                  {priorityLabel}
                </span>
              )}
              <p className={cn("text-sm font-semibold", cfg.text)}>{n.announcement.title}</p>
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={cn("text-sm mt-1 leading-relaxed overflow-hidden", cfg.text, "opacity-80")}
                >
                  {n.announcement.body}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className={cn("text-xs flex items-center gap-1 font-medium", cfg.text, "opacity-70 hover:opacity-100")}
            >
              {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
            </button>
            <button
              onClick={() => onDismiss(n._id)}
              className={cn("p-1 rounded hover:opacity-100 opacity-50 transition-opacity", cfg.text)}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Drop this component anywhere you want banners to appear (e.g., below Navbar in layout)
export function AnnouncementBanners() {
  const { data: session } = useSession();
  const { banners, dismissBanner } = useNotifications();

  if (!session || banners.length === 0) return null;

  return (
    <AnimatePresence>
      {banners.map((b) => (
        <Banner key={b._id} n={b} onDismiss={dismissBanner} />
      ))}
    </AnimatePresence>
  );
}
