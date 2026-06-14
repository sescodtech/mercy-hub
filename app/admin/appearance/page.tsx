"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Palette, Monitor, RotateCcw } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { applyThemeToDOM } from "@/hooks/useSettings";

type AppearanceTab = "brand" | "ui";

const BRAND_COLOR_FIELDS = [
  { key: "primary",   label: "Primary Color",   desc: "Main brand color — buttons, links, highlights" },
  { key: "secondary", label: "Secondary Color",  desc: "Secondary surfaces and backgrounds" },
  { key: "accent",    label: "Accent Color",     desc: "Hover states and active accents" },
  { key: "success",   label: "Success Color",    desc: "Confirmations, success badges" },
  { key: "warning",   label: "Warning Color",    desc: "Alerts, low-stock indicators" },
  { key: "error",     label: "Error Color",      desc: "Errors, destructive actions" },
];

const UI_COLOR_FIELDS = [
  { key: "headerBg",      label: "Header Background",   desc: "Top navigation background" },
  { key: "footerBg",      label: "Footer Background",   desc: "Footer section background" },
  { key: "navText",       label: "Nav Text Color",      desc: "Navigation link color" },
  { key: "navTextHover",  label: "Nav Text Hover",      desc: "Navigation link hover color" },
  { key: "buttonPrimary", label: "Button Color",        desc: "Primary button background" },
  { key: "buttonText",    label: "Button Text",         desc: "Primary button text color" },
  { key: "linkColor",     label: "Link Color",          desc: "Text links across the site" },
  { key: "cardBg",        label: "Card Background",     desc: "Product cards and content cards" },
  { key: "pageBg",        label: "Page Background",     desc: "Main page/body background" },
  { key: "sectionAltBg",  label: "Alt Section Bg",      desc: "Alternating section backgrounds" },
  { key: "borderColor",   label: "Border Color",        desc: "Dividers and input borders" },
  { key: "textPrimary",   label: "Primary Text",        desc: "Headings and body text" },
  { key: "textSecondary", label: "Secondary Text",      desc: "Muted text and captions" },
];

const BRAND_DEFAULTS = {
  primary: "#d98c2a", secondary: "#fdf8f0", accent: "#c47020",
  success: "#10b981", warning: "#f59e0b", error: "#ef4444",
};

const UI_DEFAULTS = {
  headerBg: "#fdf8f0", footerBg: "#1a1208", navText: "#404040",
  navTextHover: "#d98c2a", buttonPrimary: "#c47020", buttonText: "#ffffff",
  linkColor: "#d98c2a", cardBg: "#ffffff", pageBg: "#fdf8f0",
  sectionAltBg: "#ffffff", borderColor: "#e5e5e5",
  textPrimary: "#1a1208", textSecondary: "#737373",
};

function ColorField({
  label, desc, value, onChange,
}: { label: string; desc: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-neutral-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="w-8 h-8 rounded-lg border border-neutral-200 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-8 border border-neutral-200 rounded cursor-pointer p-0.5"
          title="Pick color"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#d98c2a"
          maxLength={7}
          className="w-24 text-sm font-mono border border-neutral-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-[#d98c2a]"
        />
      </div>
    </div>
  );
}

export default function AdminAppearancePage() {
  const [tab,     setTab]     = useState<AppearanceTab>("brand");
  const [brand,   setBrand]   = useState(BRAND_DEFAULTS);
  const [ui,      setUI]      = useState(UI_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/api/admin/settings");
        if (data.success) {
          if (data.data.brandColors) setBrand({ ...BRAND_DEFAULTS, ...data.data.brandColors });
          if (data.data.uiColors)    setUI({ ...UI_DEFAULTS, ...data.data.uiColors });
        }
      } catch { toast.error("Failed to load appearance settings"); }
      finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch("/api/admin/settings", { section: "brandColors", data: brand });
      await axios.patch("/api/admin/settings", { section: "uiColors", data: ui });

      // ── Immediately apply new colors to the DOM so the admin sees the
      //    effect without waiting for the frontend to re-fetch settings.
      applyThemeToDOM({
        brandColors: brand,
        uiColors: ui,
      } as any);

      toast.success("Appearance settings saved! Storefront will reflect changes shortly.");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const resetBrand = () => setBrand(BRAND_DEFAULTS);
  const resetUI    = () => setUI(UI_DEFAULTS);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" /></div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Website Appearance</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Change colors site-wide. No code edits required.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-neutral-100 rounded-xl p-1.5">
        {[
          { id: "brand", label: "Brand Colors",   Icon: Palette },
          { id: "ui",    label: "UI Colors",       Icon: Monitor },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as AppearanceTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === id ? "bg-[#d98c2a] text-white" : "text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-100 rounded-2xl p-6">
        {tab === "brand" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-neutral-800">Brand Colors</h2>
              <button
                onClick={resetBrand}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700"
              >
                <RotateCcw className="w-3 h-3" /> Reset to defaults
              </button>
            </div>
            <p className="text-sm text-neutral-400 mb-5">
              These colors define your brand identity and are applied across all components automatically.
            </p>
            {BRAND_COLOR_FIELDS.map(({ key, label, desc }) => (
              <ColorField
                key={key}
                label={label}
                desc={desc}
                value={(brand as any)[key]}
                onChange={(v) => setBrand((b) => ({ ...b, [key]: v }))}
              />
            ))}
          </>
        )}

        {tab === "ui" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-neutral-800">UI Colors</h2>
              <button
                onClick={resetUI}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700"
              >
                <RotateCcw className="w-3 h-3" /> Reset to defaults
              </button>
            </div>
            <p className="text-sm text-neutral-400 mb-5">
              Fine-tune specific UI surfaces. Changes here apply across headers, footers, cards, and text.
            </p>
            {UI_COLOR_FIELDS.map(({ key, label, desc }) => (
              <ColorField
                key={key}
                label={label}
                desc={desc}
                value={(ui as any)[key]}
                onChange={(v) => setUI((u) => ({ ...u, [key]: v }))}
              />
            ))}
          </>
        )}
      </div>

      {/* Live preview hint */}
      <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium">⚡ Changes apply across the entire website after saving.</p>
        <p className="text-xs text-amber-700 mt-1">
          Colors update immediately in this admin panel. The storefront refreshes within 30 seconds.
        </p>
      </div>
    </div>
  );
}
