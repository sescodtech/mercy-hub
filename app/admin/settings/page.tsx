"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Globe, Truck, CreditCard, Bell, Megaphone, Home as HomeIcon, Image } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

type Tab = "general" | "shipping" | "payments" | "announcement" | "homepage" | "seo";

interface SettingsState {
  businessName: string; tagline: string; logo: string; favicon: string;
  email: string; supportEmail: string; phone: string[]; whatsapp: string;
  address: { street: string; city: string; state: string; country: string; postalCode: string };
  social: { instagram: string; facebook: string; twitter: string; tiktok: string; youtube: string; linkedin: string };
  footer: { description: string; copyright: string };
  shipping: { enabled: boolean; freeShippingEnabled: boolean; freeShippingThreshold: number; defaultShippingCost: number };
  payments: { paystackEnabled: boolean; flutterwaveEnabled: boolean; codEnabled: boolean };
  notifications: { orderEmail: boolean; orderWhatsapp: boolean; adminEmail: string; adminPhone: string };
  announcement: { enabled: boolean; text: string; bgColor: string; textColor: string };
  homepage: { heroTitle: string; heroSubtitle: string; heroCta: string; heroCtaLink: string; heroImage: string; showFeaturedProducts: boolean; showBestSellers: boolean; showTestimonials: boolean; showNewsletter: boolean };
  meta: { title: string; description: string; keywords: string[] };
}

const defaultSettings: SettingsState = {
  businessName: "Mercy Home Essentials", tagline: "", logo: "", favicon: "",
  email: "", supportEmail: "", phone: [], whatsapp: "",
  address: { street: "", city: "", state: "", country: "Nigeria", postalCode: "" },
  social: { instagram: "", facebook: "", twitter: "", tiktok: "", youtube: "", linkedin: "" },
  footer: { description: "", copyright: "" },
  shipping: { enabled: true, freeShippingEnabled: true, freeShippingThreshold: 100000, defaultShippingCost: 2500 },
  payments: { paystackEnabled: true, flutterwaveEnabled: false, codEnabled: false },
  notifications: { orderEmail: true, orderWhatsapp: false, adminEmail: "", adminPhone: "" },
  announcement: { enabled: false, text: "Free delivery on orders above ₦100,000", bgColor: "#1a1108", textColor: "#f5f0e8" },
  homepage: { heroTitle: "Elevate Your Home", heroSubtitle: "", heroCta: "Shop Collection", heroCtaLink: "/shop", heroImage: "", showFeaturedProducts: true, showBestSellers: true, showTestimonials: true, showNewsletter: true },
  meta: { title: "", description: "", keywords: [] },
};

function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ${checked ? "bg-[#d98c2a]" : "bg-neutral-300"}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: "general",      label: "General",      Icon: Globe },
  { id: "shipping",     label: "Shipping",     Icon: Truck },
  { id: "payments",     label: "Payments",     Icon: CreditCard },
  { id: "announcement", label: "Announcement", Icon: Megaphone },
  { id: "homepage",     label: "Homepage CMS", Icon: HomeIcon },
  { id: "seo",          label: "SEO",          Icon: Bell },
];

export default function AdminSettingsPage() {
  const [s,       setS]       = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState<Tab>("general");

  useEffect(() => {
    (async () => {
      try { const { data } = await axios.get("/api/admin/settings"); if (data.success) setS({ ...defaultSettings, ...data.data }); }
      catch { toast.error("Failed to load settings"); }
      finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try { await axios.put("/api/admin/settings", s); toast.success("Settings saved!"); }
    catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const upd = (path: string, val: any) => {
    const keys = path.split(".");
    setS((prev: any) => {
      const next = structuredClone(prev);
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = val;
      return next;
    });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" /></div>;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold">Store Settings</h1><p className="text-sm text-neutral-400">Manage all site-wide settings from one place</p></div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-white border border-neutral-100 rounded-xl p-1.5 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === id ? "bg-[#d98c2a] text-white" : "text-neutral-600 hover:bg-neutral-50"}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-100 rounded-2xl p-6 space-y-5">

        {tab === "general" && <>
          <h2 className="font-semibold text-neutral-800 mb-4">Business Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Business Name" value={s.businessName} onChange={(v) => upd("businessName", v)} />
            <Input label="Tagline" value={s.tagline} onChange={(v) => upd("tagline", v)} />
            <Input label="Logo URL" value={s.logo} onChange={(v) => upd("logo", v)} placeholder="https://..." />
            <Input label="WhatsApp Number" value={s.whatsapp} onChange={(v) => upd("whatsapp", v)} placeholder="+2348012345678" />
            <Input label="Email" value={s.email} onChange={(v) => upd("email", v)} type="email" />
            <Input label="Support Email" value={s.supportEmail} onChange={(v) => upd("supportEmail", v)} type="email" />
          </div>
          <h3 className="font-semibold text-neutral-700 pt-2">Address</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Street" value={s.address.street} onChange={(v) => upd("address.street", v)} />
            <Input label="City" value={s.address.city} onChange={(v) => upd("address.city", v)} />
            <Input label="State" value={s.address.state} onChange={(v) => upd("address.state", v)} />
            <Input label="Country" value={s.address.country} onChange={(v) => upd("address.country", v)} />
          </div>
          <h3 className="font-semibold text-neutral-700 pt-2">Social Links</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {(Object.keys(s.social) as (keyof typeof s.social)[]).map((k) => (
              <Input key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={s.social[k]} onChange={(v) => upd(`social.${k}`, v)} placeholder="https://..." />
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Footer Description</label>
            <textarea value={s.footer.description} onChange={(e) => upd("footer.description", e.target.value)} rows={3}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none" />
          </div>
        </>}

        {tab === "shipping" && <>
          <h2 className="font-semibold text-neutral-800 mb-2">Shipping Configuration</h2>
          <p className="text-sm text-neutral-400 mb-4">All shipping values across the site are controlled from here.</p>
          <Toggle label="Enable Shipping" description="When disabled, no shipping charges will be applied to any order" checked={s.shipping.enabled} onChange={(v) => upd("shipping.enabled", v)} />
          {s.shipping.enabled && <>
            <Toggle label="Enable Free Shipping" description="Allow free shipping when order meets the threshold" checked={s.shipping.freeShippingEnabled} onChange={(v) => upd("shipping.freeShippingEnabled", v)} />
            {s.shipping.freeShippingEnabled && (
              <div className="pt-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Free Shipping Threshold (₦)</label>
                <input type="number" value={s.shipping.freeShippingThreshold} onChange={(e) => upd("shipping.freeShippingThreshold", Number(e.target.value))}
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
                <p className="text-xs text-neutral-400 mt-1">Orders above this amount get free shipping</p>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Default Shipping Cost (₦)</label>
              <input type="number" value={s.shipping.defaultShippingCost} onChange={(e) => upd("shipping.defaultShippingCost", Number(e.target.value))}
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
            </div>
          </>}

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4">
            <p className="text-sm text-amber-800 font-medium">Current Configuration Preview</p>
            <p className="text-xs text-amber-700 mt-1">
              {!s.shipping.enabled ? "Shipping disabled — all orders have free delivery." :
               s.shipping.freeShippingEnabled ? `Free shipping on orders over ₦${s.shipping.freeShippingThreshold.toLocaleString()}. Standard fee: ₦${s.shipping.defaultShippingCost.toLocaleString()}.` :
               `Standard shipping fee: ₦${s.shipping.defaultShippingCost.toLocaleString()} on all orders.`}
            </p>
          </div>
        </>}

        {tab === "payments" && <>
          <h2 className="font-semibold text-neutral-800 mb-4">Payment Methods</h2>
          <Toggle label="Paystack" description="Accept payments via Paystack (Card, Bank Transfer, USSD)" checked={s.payments.paystackEnabled} onChange={(v) => upd("payments.paystackEnabled", v)} />
          <Toggle label="Flutterwave" description="Accept payments via Flutterwave" checked={s.payments.flutterwaveEnabled} onChange={(v) => upd("payments.flutterwaveEnabled", v)} />
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-sm text-red-700 font-medium">Cash on Delivery — Disabled</p>
            <p className="text-xs text-red-600 mt-1">Per business policy, payment is required before order processing. Cash on Delivery is permanently disabled.</p>
          </div>
          <h3 className="font-semibold text-neutral-700 pt-4">Notifications</h3>
          <Toggle label="Email Order Notifications" checked={s.notifications.orderEmail} onChange={(v) => upd("notifications.orderEmail", v)} />
          <Toggle label="WhatsApp Order Notifications" checked={s.notifications.orderWhatsapp} onChange={(v) => upd("notifications.orderWhatsapp", v)} />
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <Input label="Admin Email for Notifications" value={s.notifications.adminEmail} onChange={(v) => upd("notifications.adminEmail", v)} type="email" />
            <Input label="Admin Phone for WhatsApp" value={s.notifications.adminPhone} onChange={(v) => upd("notifications.adminPhone", v)} />
          </div>
        </>}

        {tab === "announcement" && <>
          <h2 className="font-semibold text-neutral-800 mb-4">Announcement Bar</h2>
          <Toggle label="Show Announcement Bar" description="Display a banner at the top of the site" checked={s.announcement.enabled} onChange={(v) => upd("announcement.enabled", v)} />
          {s.announcement.enabled && <>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Announcement Text</label>
              <input value={s.announcement.text} onChange={(e) => upd("announcement.text", e.target.value)}
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Background Color</label>
                <div className="flex gap-2">
                  <input type="color" value={s.announcement.bgColor} onChange={(e) => upd("announcement.bgColor", e.target.value)} className="w-12 h-10 border border-neutral-200 rounded cursor-pointer" />
                  <input value={s.announcement.bgColor} onChange={(e) => upd("announcement.bgColor", e.target.value)} className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Text Color</label>
                <div className="flex gap-2">
                  <input type="color" value={s.announcement.textColor} onChange={(e) => upd("announcement.textColor", e.target.value)} className="w-12 h-10 border border-neutral-200 rounded cursor-pointer" />
                  <input value={s.announcement.textColor} onChange={(e) => upd("announcement.textColor", e.target.value)} className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
                </div>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border mt-2" style={{ backgroundColor: s.announcement.bgColor, color: s.announcement.textColor }}>
              <p className="text-center text-xs uppercase tracking-widest py-2.5 font-body">{s.announcement.text || "Preview"}</p>
            </div>
          </>}
        </>}

        {tab === "homepage" && <>
          <h2 className="font-semibold text-neutral-800 mb-4">Homepage Content</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Hero Title" value={s.homepage.heroTitle} onChange={(v) => upd("homepage.heroTitle", v)} />
            <Input label="Hero CTA Text" value={s.homepage.heroCta} onChange={(v) => upd("homepage.heroCta", v)} />
            <Input label="Hero CTA Link" value={s.homepage.heroCtaLink} onChange={(v) => upd("homepage.heroCtaLink", v)} />
            <Input label="Hero Image URL" value={s.homepage.heroImage} onChange={(v) => upd("homepage.heroImage", v)} placeholder="https://..." />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Hero Subtitle</label>
            <textarea value={s.homepage.heroSubtitle} onChange={(e) => upd("homepage.heroSubtitle", e.target.value)} rows={3}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none" />
          </div>
          <h3 className="font-semibold text-neutral-700 pt-4">Sections Visibility</h3>
          <Toggle label="Featured Products" description="Show featured products section on homepage" checked={s.homepage.showFeaturedProducts} onChange={(v) => upd("homepage.showFeaturedProducts", v)} />
          <Toggle label="Best Sellers" description="Show best sellers section on homepage" checked={s.homepage.showBestSellers} onChange={(v) => upd("homepage.showBestSellers", v)} />
          <Toggle label="Testimonials" description="Show customer testimonials section" checked={s.homepage.showTestimonials} onChange={(v) => upd("homepage.showTestimonials", v)} />
          <Toggle label="Newsletter Section" description="Show newsletter signup section" checked={s.homepage.showNewsletter} onChange={(v) => upd("homepage.showNewsletter", v)} />
        </>}

        {tab === "seo" && <>
          <h2 className="font-semibold text-neutral-800 mb-4">SEO Settings</h2>
          <Input label="Meta Title" value={s.meta.title} onChange={(v) => upd("meta.title", v)} placeholder="Mercy Home Essentials — Premium Home Goods" />
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Meta Description</label>
            <textarea value={s.meta.description} onChange={(e) => upd("meta.description", e.target.value)} rows={3}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none" placeholder="Describe your store for search engines…" />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Meta Keywords (comma-separated)</label>
            <input value={(s.meta.keywords || []).join(", ")} onChange={(e) => upd("meta.keywords", e.target.value.split(",").map(k => k.trim()).filter(Boolean))}
              placeholder="home goods, Nigeria, premium bedding" className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Footer Copyright Text</label>
            <input value={s.footer.copyright} onChange={(e) => upd("footer.copyright", e.target.value)} placeholder="© 2025 Mercy Home Essentials. All rights reserved."
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
          </div>
        </>}
      </div>
    </div>
  );
}
