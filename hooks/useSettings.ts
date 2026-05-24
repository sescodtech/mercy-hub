"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import axios from "axios";
import type { ISettings } from "@/lib/models/Settings";

interface SettingsContext {
  settings: Partial<ISettings> | null;
  loading: boolean;
  refresh: () => void;
}

const Ctx = createContext<SettingsContext>({ settings: null, loading: true, refresh: () => {} });

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Partial<ISettings> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/settings");
      if (data.success) setSettings(data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return <Ctx.Provider value={{ settings, loading, refresh: fetch }}>{children}</Ctx.Provider>;
}

export function useSettings() {
  return useContext(Ctx);
}
