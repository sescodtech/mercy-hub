"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { ISiteSettings } from "@/types";

// ── Cache ─────────────────────────────────────────────────────
let cache: ISiteSettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── Context ───────────────────────────────────────────────────
interface SettingsContextValue {
  settings: ISiteSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  loading: true,
  error: null,
  refetch: () => {},
});

// ── Provider ──────────────────────────────────────────────────
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ISiteSettings | null>(cache);
  const [loading,  setLoading]  = useState(!cache);
  const [error,    setError]    = useState<string | null>(null);

  const fetchSettings = async () => {
    // Use cache if still fresh
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      setSettings(cache);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        cache     = json.data;
        cacheTime = Date.now();
        setSettings(json.data);
        setError(null);
      } else {
        setError("Failed to load settings");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useSettings() {
  return useContext(SettingsContext);
}
