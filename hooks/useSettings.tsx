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

// ── Theme Application ──────────────────────────────────────────
function applyThemeToDOM(settings: ISiteSettings | null) {
  if (!settings) return;

  const root = document.documentElement;
  
  // Primary brand color
  if (settings.brandColor) {
    root.style.setProperty("--color-brand-primary", settings.brandColor);
  }

  // Secondary/muted colors
  if (settings.colors?.secondary) {
    root.style.setProperty("--color-secondary", settings.colors.secondary);
  }

  // Text colors
  if (settings.colors?.textPrimary) {
    root.style.setProperty("--color-text-primary", settings.colors.textPrimary);
  }
  if (settings.colors?.textSecondary) {
    root.style.setProperty("--color-text-secondary", settings.colors.textSecondary);
  }

  // Header background
  if (settings.colors?.headerBg) {
    root.style.setProperty("--color-header-bg", settings.colors.headerBg);
  }

  // Border color
  if (settings.colors?.border) {
    root.style.setProperty("--color-border", settings.colors.border);
  }

  // Nav text color
  if (settings.colors?.navText) {
    root.style.setProperty("--color-nav-text", settings.colors.navText);
  }
}

// ── Provider ──────────────────────────────────────────────────
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ISiteSettings | null>(cache);
  const [loading,  setLoading]  = useState(!cache);
  const [error,    setError]    = useState<string | null>(null);
  const [mounted,  setMounted]  = useState(false);

  const fetchSettings = async () => {
    // Use cache if still fresh
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      setSettings(cache);
      setLoading(false);
      if (mounted) applyThemeToDOM(cache);
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
        // Apply theme to DOM immediately
        if (mounted) applyThemeToDOM(json.data);
      } else {
        setError("Failed to load settings");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, []);

  // Apply theme whenever settings change
  useEffect(() => {
    if (settings && mounted) {
      applyThemeToDOM(settings);
    }
  }, [settings, mounted]);

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
