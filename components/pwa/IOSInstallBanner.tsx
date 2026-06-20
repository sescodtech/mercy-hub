"use client";

import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";

export function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS devices not already installed as PWA
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");

    if (isIOS && !isInStandaloneMode && !dismissed) {
      // Small delay so it doesn't flash immediately on load
      setTimeout(() => setShow(true), 2500);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem("pwa-banner-dismissed", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-3 right-3 z-50 rounded-2xl shadow-xl p-4 flex items-start gap-3"
      style={{ backgroundColor: "#1a1208", color: "#fff" }}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-white/10 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/apple-touch-icon.png" alt="MercyHome" className="w-10 h-10" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight mb-0.5">Install MercyHome App</p>
        <p className="text-xs text-white/60 leading-snug">
          Open in <span className="text-white font-medium">Safari</span>, tap{" "}
          <Share className="inline w-3 h-3 mb-0.5" /> then{" "}
          <span className="text-white font-medium">&ldquo;Add to Home Screen&rdquo;</span>
        </p>
      </div>

      {/* Dismiss */}
      <button onClick={dismiss} className="flex-shrink-0 text-white/40 hover:text-white/80 transition-colors mt-0.5">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
