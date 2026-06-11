"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

export interface NotificationAnnouncement {
  _id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "maintenance" | "update";
  priority: "low" | "normal" | "high" | "urgent";
  startDate: string;
  expiresAt: string | null;
}

export interface UserNotification {
  _id: string;
  announcement: NotificationAnnouncement;
  isRead: boolean;
  isDismissed: boolean;
  readAt: string | null;
  createdAt: string;
}

interface UseNotificationsReturn {
  notifications: UserNotification[];
  banners: UserNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismissBanner: (id: string) => void;
  refresh: () => void;
}

export function useNotifications(pollInterval = 60000): UseNotificationsReturn {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [banners,       setBanners]       = useState<UserNotification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const { data } = await axios.get("/api/notifications");
      if (data.success) {
        setNotifications(data.data.notifications);
        setBanners(data.data.banners);
        setUnreadCount(data.data.unreadCount);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch();
      timerRef.current = setInterval(fetch, pollInterval);
    } else {
      setLoading(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, fetch, pollInterval]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => n._id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await axios.patch(`/api/notifications/${id}`, { action: "read" }); }
    catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try { await axios.post("/api/notifications/mark-all-read"); }
    catch { /* silent */ }
  }, []);

  const dismissBanner = useCallback(async (id: string) => {
    setBanners((prev) => prev.filter((n) => n._id !== id));
    setNotifications((prev) =>
      prev.map((n) => n._id === id ? { ...n, isDismissed: true, isRead: true } : n)
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try { await axios.patch(`/api/notifications/${id}`, { action: "dismiss" }); }
    catch { /* silent */ }
  }, []);

  return {
    notifications, banners, unreadCount, loading,
    markRead, markAllRead, dismissBanner, refresh: fetch,
  };
}
