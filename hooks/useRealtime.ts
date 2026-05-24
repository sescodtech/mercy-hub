"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

interface Notification {
  id: string;
  type: "new_order" | "low_stock" | "new_customer";
  message: string;
  data?: unknown;
  read: boolean;
  createdAt: Date;
}

interface UseRealtimeOptions {
  interval?: number; // polling interval in ms
  enabled?: boolean;
}

export function useRealtimeOrders(options: UseRealtimeOptions = {}) {
  const { interval = 30000, enabled = true } = options; // poll every 30s
  const [latestOrderCount, setLatestOrderCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCountRef = useRef(0);
  const isFirstPoll = useRef(true);

  const poll = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/admin/orders?limit=1&page=1");
      if (data.success) {
        const newCount = data.pagination.total;

        // If count increased and not first poll — new order arrived!
        if (!isFirstPoll.current && newCount > lastCountRef.current) {
          const diff = newCount - lastCountRef.current;
          const newNotif: Notification = {
            id: Date.now().toString(),
            type: "new_order",
            message: `${diff} new order${diff > 1 ? "s" : ""} received!`,
            read: false,
            createdAt: new Date(),
          };
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          setUnreadCount((c) => c + diff);

          // Browser notification if permitted
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("New Order — Mercy Home!", {
                body: `${diff} new order${diff > 1 ? "s" : ""} received`,
                icon: "/favicon.ico",
              });
            }
          }
        }

        isFirstPoll.current = false;
        lastCountRef.current = newCount;
        setLatestOrderCount(newCount);
      }
    } catch {
      // Silent fail — don't spam console on every poll
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Request browser notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    poll(); // immediate first poll
    const timer = setInterval(poll, interval);
    return () => clearInterval(timer);
  }, [enabled, interval, poll]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  return {
    latestOrderCount,
    notifications,
    unreadCount,
    markAllRead,
    markRead,
  };
}

export function useRealtimeAnalytics(range = "30") {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetch = useCallback(async () => {
    try {
      const res = await axios.get(`/api/admin/analytics?range=${range}`);
      if (res.data.success) {
        setData(res.data.data);
        setLastUpdated(new Date());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetch();
    const timer = setInterval(fetch, 60000); // refresh every 60s
    return () => clearInterval(timer);
  }, [fetch]);

  return { data, loading, lastUpdated, refresh: fetch };
}
