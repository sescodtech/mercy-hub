import { useEffect, useState } from "react";
import type { ISiteSettings } from "@/types";

let cache: ISiteSettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min client-side cache

export function useSettings() {
  const [settings, setSettings] = useState<ISiteSettings | null>(cache);
  const [loading,  setLoading]  = useState(!cache);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    // Use cache if fresh
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      setSettings(cache);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/settings", { next: { revalidate: 300 } });
        const json = await res.json();
        if (json.success) {
          cache = json.data;
          cacheTime = Date.now();
          setSettings(json.data);
        } else {
          setError("Failed to load settings");
        }
      } catch (e) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { settings, loading, error };
}
