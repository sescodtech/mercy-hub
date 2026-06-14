"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { ISiteSettings } from "@/types";

// ── Cache ─────────────────────────────────────────────────────
let cache: ISiteSettings | null = null;
let cacheTime = 0;
// Reduced to 30s so admin changes propagate faster to other tabs
const CACHE_TTL = 30 * 1000;

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
// Reads from settings.brandColors and settings.uiColors and writes
// them as CSS custom properties so the entire frontend reflects
// whatever the admin saved in /admin/appearance.
export function applyThemeToDOM(settings: ISiteSettings | null) {
  if (typeof document === "undefined" || !settings) return;

  const root = document.documentElement;

  // ── Brand colors ─────────────────────────────────────────
  const brand = settings.brandColors;
  if (brand) {
    if (brand.primary)   root.style.setProperty("--color-brand-primary",   brand.primary);
    if (brand.secondary) root.style.setProperty("--color-brand-secondary",  brand.secondary);
    if (brand.accent)    root.style.setProperty("--color-brand-accent",     brand.accent);
    if (brand.success)   root.style.setProperty("--color-brand-success",    brand.success);
    if (brand.warning)   root.style.setProperty("--color-brand-warning",    brand.warning);
    if (brand.error)     root.style.setProperty("--color-brand-error",      brand.error);
  }

  // ── UI / surface colors ───────────────────────────────────
  const ui = settings.uiColors;
  if (ui) {
    if (ui.headerBg)      root.style.setProperty("--color-header-bg",       ui.headerBg);
    if (ui.footerBg)      root.style.setProperty("--color-footer-bg",       ui.footerBg);
    if (ui.navText)       root.style.setProperty("--color-nav-text",        ui.navText);
    if (ui.navTextHover)  root.style.setProperty("--color-nav-text-hover",  ui.navTextHover);
    if (ui.buttonPrimary) root.style.setProperty("--color-button-primary",  ui.buttonPrimary);
    if (ui.buttonText)    root.style.setProperty("--color-button-text",     ui.buttonText);
    if (ui.linkColor)     root.style.setProperty("--color-link",            ui.linkColor);
    if (ui.cardBg)        root.style.setProperty("--color-card-bg",         ui.cardBg);
    if (ui.pageBg)        root.style.setProperty("--color-page-bg",         ui.pageBg);
    if (ui.sectionAltBg)  root.style.setProperty("--color-section-alt-bg",  ui.sectionAltBg);
    if (ui.borderColor)   root.style.setProperty("--color-border",          ui.borderColor);
    if (ui.textPrimary)   root.style.setProperty("--color-text-primary",    ui.textPrimary);
    if (ui.textSecondary) root.style.setProperty("--color-text-secondary",  ui.textSecondary);

    // Apply page background to body so the whole page reflects the setting
    if (ui.pageBg) {
      document.body.style.backgroundColor = ui.pageBg;
    }
  }
}

// ── Provider ──────────────────────────────────────────────────
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ISiteSettings | null>(cache);
  const [loading,  setLoading]  = useState(!cache);
  const [error,    setError]    = useState<string | null>(null);
  const [mounted,  setMounted]  = useState(false);

  const fetchSettings = async (bypassCache = false) => {
    // Use cache if still fresh and not explicitly bypassing
    if (!bypassCache && cache && Date.now() - cacheTime < CACHE_TTL) {
      setSettings(cache);
      setLoading(false);
      if (mounted) applyThemeToDOM(cache);
      return;
    }
    setLoading(true);
    try {
      // Cache-bust so the browser always gets fresh data
      const res  = await fetch(`/api/settings?t=${Date.now()}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        cache     = json.data;
        cacheTime = Date.now();
        setSettings(json.data);
        setError(null);
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

  useEffect(() => {
    setMounted(true);
    fetchSettings();
  }, []);

  // Re-apply theme whenever settings change after mount
  useEffect(() => {
    if (settings && mounted) {
      applyThemeToDOM(settings);
    }
  }, [settings, mounted]);

  // Expose a refetch that always bypasses cache (for post-save refresh)
  const refetch = () => {
    cache = null;
    cacheTime = 0;
    fetchSettings(true);
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refetch }}>
      {children}
    </SettingsContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────
export function useSettings() {
  return useContext(SettingsContext);
}
