"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Save, Upload, Building2, Mail, Phone, MapPin, Globe,
  Instagram, Facebook, Twitter, Youtube, MessageCircle,
  FileText, ShoppingBag, Bell, CreditCard, Loader2,
  AlertTriangle, CheckCircle, Plus, Trash2, RefreshCw,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/utils";

type Tab = "general" | "contact" | "social" | "footer" | "shipping" | "payments" | "notifications" | "advanced" | "admin-users";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general",       label: "General",       icon: Building2 },
  { id: "contact",       label: "Contact",        icon: Phone },
  { id: "social",        label: "Social",         icon: Globe },
  { id: "footer",        label: "Footer",         icon: FileText },
  { id: "shipping",      label: "Shipping",       icon: ShoppingBag },
  { id: "payments",      label: "Payments",       icon: CreditCard },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "advanced",      label: "Advanced",       icon: AlertTriangle },
  { id: "admin-users",   label: "Admin Users",    icon: Mail },
];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block">{label}</label>
      {children}
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors", className)}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors resize-none"
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className={cn("w-11 h-6 rounded-full transition-colors", checked ? "bg-[#d98c2a]" : "bg-neutral-200")} />
        <div className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
      </div>
      <span className="text-sm text-neutral-700 group-hover:text-neutral-900">{label}</span>
    </label>
  );
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const [s, setS] = useState({
    businessName: "", tagline: "", logo: "", favicon: "",
    email: "", supportEmail: "",
    phone: [""], whatsapp: "",
    address: { street: "", city: "", state: "", country: "Nigeria", postalCode: "" },
    website: "",
    social: { instagram: "", facebook: "", twitter: "", tiktok: "", youtube: "", linkedin: "" },
    footer: { description: "", copyright: "", links: [] as { label: string; href: string }[] },
    about: "",
    meta: { title: "", description: "", keywords: [] as string[] },
    shipping: { freeShippingThreshold: 50000, defaultShippingCost: 2500, currency: "NGN" },
    payments: { paystackEnabled: true, flutterwaveEnabled: false, codEnabled: true },
    notifications: { orderEmail: true, orderWhatsapp: false, adminEmail: "", adminPhone: "" },
    maintenance: false,
  });

  useEffect(() => {
    axios.get("/api/admin/settings").then(({ data }) => {
      if (data.success) setS((prev) => ({ ...prev, ...data.data }));
    }).finally(() => setLoading(false));
  }, []);

  const set = (path: string, value: unknown) => {
    setS((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let obj: Record<string, unknown> = next as Record<string, unknown>;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...(obj[keys[i]] as Record<string, unknown>) };
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await axios.put("/api/admin/settings", s);
      if (data.success) toast.success("Settings saved!");
      else toast.error(data.error ?? "Failed to save");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File, field: "logo" | "favicon") => {
    const setter = field === "logo" ? setUploadingLogo : setUploadingFavicon;
    setter(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "settings");
      const { data } = await axios.post("/api/upload", form);
      if (data.success) {
        set(field, data.url);
        toast.success(`${field === "logo" ? "Logo" : "Favicon"} uploaded!`);
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setter(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="bg-white border-b border-neutral-200 px-6 py-5 sticky top-0 z-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Settings</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Changes reflect globally across the entire store</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#d98c2a] text-white text-sm rounded-lg hover:bg-[#c47020] disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Settings"}
            </button>
            <Link href="/admin" className="text-sm text-[#d98c2a]">← Dashboard</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto pb-px">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex-shrink-0",
                tab === id ? "bg-[#d98c2a]/10 text-[#d98c2a] font-medium" : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100")}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">

        {/* ── GENERAL ── */}
        {tab === "general" && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-5">
              <h2 className="font-semibold text-neutral-900">Business Identity</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Business Name">
                  <Input value={s.businessName} onChange={(v) => set("businessName", v)} placeholder="Mercy Home Essentials" />
                </Field>
                <Field label="Tagline">
                  <Input value={s.tagline} onChange={(v) => set("tagline", v)} placeholder="Premium Home Goods" />
                </Field>
              </div>
              <Field label="About / Store Description" hint="Used on About page and footer">
                <Textarea value={s.about} onChange={(v) => set("about", v)} rows={4} placeholder="Tell customers about your store…" />
              </Field>
              <Field label="Website URL">
                <Input value={s.website} onChange={(v) => set("website", v)} placeholder="https://mercy-hub.vercel.app" />
              </Field>
            </div>

            {/* Logo & Favicon */}
            <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-5">
              <h2 className="font-semibold text-neutral-900">Logo & Favicon</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Logo" hint="Recommended: 200×60px PNG with transparent background">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-14 border-2 border-dashed border-neutral-200 rounded-lg flex items-center justify-center bg-neutral-50 overflow-hidden">
                      {s.logo ? <Image src={s.logo} alt="Logo" width={96} height={56} className="object-contain" /> : <Building2 className="w-6 h-6 text-neutral-300" />}
                    </div>
                    <div>
                      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "logo")} />
                      <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                        className="flex items-center gap-2 px-3 py-2 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                        {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Upload Logo
                      </button>
                      {s.logo && <button onClick={() => set("logo", "")} className="mt-1 text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><Trash2 className="w-3 h-3" />Remove</button>}
                    </div>
                  </div>
                </Field>

                <Field label="Favicon" hint="Recommended: 32×32px ICO or PNG">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border-2 border-dashed border-neutral-200 rounded-lg flex items-center justify-center bg-neutral-50 overflow-hidden">
                      {s.favicon ? <Image src={s.favicon} alt="Favicon" width={32} height={32} className="object-contain" /> : <Globe className="w-4 h-4 text-neutral-300" />}
                    </div>
                    <div>
                      <input ref={faviconRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "favicon")} />
                      <button onClick={() => faviconRef.current?.click()} disabled={uploadingFavicon}
                        className="flex items-center gap-2 px-3 py-2 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                        {uploadingFavicon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Upload Favicon
                      </button>
                    </div>
                  </div>
                </Field>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-4">
              <h2 className="font-semibold text-neutral-900">SEO / Meta</h2>
              <Field label="Meta Title">
                <Input value={s.meta.title} onChange={(v) => set("meta.title", v)} placeholder="Mercy Home Essentials — Premium Home Goods" />
              </Field>
              <Field label="Meta Description">
                <Textarea value={s.meta.description} onChange={(v) => set("meta.description", v)} rows={2} placeholder="Discover premium home essentials…" />
              </Field>
              <Field label="Keywords" hint="Comma-separated">
                <Input value={s.meta.keywords.join(", ")} onChange={(v) => set("meta.keywords", v.split(",").map((k) => k.trim()).filter(Boolean))} placeholder="home goods, kitchen, bedroom" />
              </Field>
            </div>
          </div>
        )}

        {/* ── CONTACT ── */}
        {tab === "contact" && (
          <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-5">
            <h2 className="font-semibold text-neutral-900">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Primary Email">
                <Input type="email" value={s.email} onChange={(v) => set("email", v)} placeholder="hello@mercyhome.ng" />
              </Field>
              <Field label="Support Email">
                <Input type="email" value={s.supportEmail} onChange={(v) => set("supportEmail", v)} placeholder="support@mercyhome.ng" />
              </Field>
            </div>
            <Field label="WhatsApp Number" hint="Include country code e.g. 2348012345678">
              <Input value={s.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="2348012345678" />
            </Field>

            {/* Phone numbers */}
            <Field label="Phone Number(s)">
              <div className="space-y-2">
                {s.phone.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={p} onChange={(v) => {
                      const phones = [...s.phone];
                      phones[i] = v;
                      set("phone", phones);
                    }} placeholder="+234 801 234 5678" />
                    {s.phone.length > 1 && (
                      <button onClick={() => set("phone", s.phone.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => set("phone", [...s.phone, ""])}
                  className="flex items-center gap-1.5 text-xs text-[#d98c2a] hover:text-[#c47020]">
                  <Plus className="w-3.5 h-3.5" /> Add phone number
                </button>
              </div>
            </Field>

            {/* Address */}
            <div className="pt-2 border-t border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-700 mb-4">Physical Address</h3>
              <div className="space-y-3">
                <Field label="Street Address">
                  <Input value={s.address.street} onChange={(v) => set("address.street", v)} placeholder="123 Adeola Odeku Street" />
                </Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="City">
                    <Input value={s.address.city} onChange={(v) => set("address.city", v)} placeholder="Lagos" />
                  </Field>
                  <Field label="State">
                    <Input value={s.address.state} onChange={(v) => set("address.state", v)} placeholder="Lagos State" />
                  </Field>
                  <Field label="Country">
                    <Input value={s.address.country} onChange={(v) => set("address.country", v)} placeholder="Nigeria" />
                  </Field>
                  <Field label="Postal Code">
                    <Input value={s.address.postalCode} onChange={(v) => set("address.postalCode", v)} placeholder="100001" />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SOCIAL ── */}
        {tab === "social" && (
          <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-4">
            <h2 className="font-semibold text-neutral-900">Social Media Links</h2>
            {([
              ["instagram", "Instagram", Instagram],
              ["facebook",  "Facebook",  Facebook],
              ["twitter",   "Twitter / X", Twitter],
              ["tiktok",    "TikTok",    MessageCircle],
              ["youtube",   "YouTube",   Youtube],
              ["linkedin",  "LinkedIn",  Globe],
            ] as [string, string, React.ElementType][]).map(([key, label, Icon]) => (
              <Field key={key} label={label}>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 border border-neutral-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-neutral-400" />
                  </div>
                  <Input value={(s.social as Record<string, string>)[key]} onChange={(v) => set(`social.${key}`, v)} placeholder={`https://…`} />
                </div>
              </Field>
            ))}
          </div>
        )}

        {/* ── FOOTER ── */}
        {tab === "footer" && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-4">
              <h2 className="font-semibold text-neutral-900">Footer Content</h2>
              <Field label="Footer Description" hint="Short text shown in footer about your store">
                <Textarea value={s.footer.description} onChange={(v) => set("footer.description", v)} rows={3} placeholder="We deliver premium home essentials across Nigeria…" />
              </Field>
              <Field label="Copyright Text">
                <Input value={s.footer.copyright} onChange={(v) => set("footer.copyright", v)} placeholder={`© ${new Date().getFullYear()} Mercy Home Essentials. All rights reserved.`} />
              </Field>
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">Footer Links</h2>
                <button onClick={() => set("footer.links", [...s.footer.links, { label: "", href: "" }])}
                  className="flex items-center gap-1.5 text-xs text-[#d98c2a] hover:text-[#c47020]">
                  <Plus className="w-3.5 h-3.5" /> Add link
                </button>
              </div>
              {s.footer.links.length === 0 && (
                <p className="text-sm text-neutral-400">No footer links yet. Add some to display in the footer.</p>
              )}
              {s.footer.links.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={link.label} onChange={(v) => {
                    const links = [...s.footer.links];
                    links[i] = { ...links[i], label: v };
                    set("footer.links", links);
                  }} placeholder="Label (e.g. Privacy Policy)" className="flex-1" />
                  <Input value={link.href} onChange={(v) => {
                    const links = [...s.footer.links];
                    links[i] = { ...links[i], href: v };
                    set("footer.links", links);
                  }} placeholder="/privacy" className="flex-1" />
                  <button onClick={() => set("footer.links", s.footer.links.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-600 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SHIPPING ── */}
        {tab === "shipping" && (
          <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-5">
            <h2 className="font-semibold text-neutral-900">Shipping Configuration</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Free Shipping Threshold (₦)" hint="Orders above this amount get free shipping">
                <Input type="number" value={String(s.shipping.freeShippingThreshold)} onChange={(v) => set("shipping.freeShippingThreshold", Number(v))} placeholder="50000" />
              </Field>
              <Field label="Default Shipping Cost (₦)" hint="Applied when order is below threshold">
                <Input type="number" value={String(s.shipping.defaultShippingCost)} onChange={(v) => set("shipping.defaultShippingCost", Number(v))} placeholder="2500" />
              </Field>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-700">
                Orders over <strong>₦{s.shipping.freeShippingThreshold.toLocaleString()}</strong> will qualify for free shipping.
                Others are charged <strong>₦{s.shipping.defaultShippingCost.toLocaleString()}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {tab === "payments" && (
          <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-5">
            <h2 className="font-semibold text-neutral-900">Payment Methods</h2>
            <p className="text-sm text-neutral-500">Enable or disable payment options shown at checkout.</p>
            <div className="space-y-4 pt-2">
              <Toggle checked={s.payments.paystackEnabled} onChange={(v) => set("payments.paystackEnabled", v)} label="Paystack (Card, Bank Transfer, USSD)" />
              <Toggle checked={s.payments.flutterwaveEnabled} onChange={(v) => set("payments.flutterwaveEnabled", v)} label="Flutterwave" />
              <Toggle checked={s.payments.codEnabled} onChange={(v) => set("payments.codEnabled", v)} label="Cash on Delivery (COD)" />
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-800">
              API keys for Paystack and Flutterwave are configured in your <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">.env.local</code> file.
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === "notifications" && (
          <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-5">
            <h2 className="font-semibold text-neutral-900">Order Notifications</h2>
            <div className="space-y-4">
              <Toggle checked={s.notifications.orderEmail} onChange={(v) => set("notifications.orderEmail", v)} label="Send email notification on new orders" />
              <Toggle checked={s.notifications.orderWhatsapp} onChange={(v) => set("notifications.orderWhatsapp", v)} label="Send WhatsApp notification on new orders" />
            </div>
            <div className="pt-4 border-t border-neutral-100 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-700">Admin Notification Recipients</h3>
              <Field label="Admin Email">
                <Input type="email" value={s.notifications.adminEmail} onChange={(v) => set("notifications.adminEmail", v)} placeholder="admin@mercyhome.ng" />
              </Field>
              <Field label="Admin WhatsApp (for order alerts)" hint="Include country code">
                <Input value={s.notifications.adminPhone} onChange={(v) => set("notifications.adminPhone", v)} placeholder="2348012345678" />
              </Field>
            </div>
          </div>
        )}

        {/* ── ADVANCED ── */}
        {tab === "advanced" && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-4">
              <h2 className="font-semibold text-neutral-900">Maintenance Mode</h2>
              <Toggle checked={s.maintenance} onChange={(v) => set("maintenance", v)} label="Enable maintenance mode (store will be inaccessible to customers)" />
              {s.maintenance && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Maintenance mode is ON</p>
                    <p className="text-xs text-red-600 mt-0.5">Customers cannot access the store. Only admins can browse.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-4">
              <h2 className="font-semibold text-neutral-900">Cache</h2>
              <p className="text-sm text-neutral-500">Settings are cached for 60 seconds site-wide. After saving, changes will reflect within 1 minute.</p>
              <button onClick={async () => {
                try {
                  await axios.post("/api/admin/cache/clear");
                  toast.success("Cache cleared!");
                } catch {
                  toast.error("Failed to clear cache");
                }
              }} className="flex items-center gap-2 px-4 py-2 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors">
                <RefreshCw className="w-4 h-4 text-neutral-500" /> Clear Cache
              </button>
            </div>
          </div>
        )}

        {/* ── ADMIN USERS ── */}
        {tab === "admin-users" && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-5">
              <h2 className="font-semibold text-neutral-900">Promote User to Admin</h2>
              <p className="text-sm text-neutral-500">
                Enter a registered customer email to grant them admin access. They must log out and back in for the change to take effect.
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors"
                />
                <button
                  onClick={async () => {
                    if (!promoteEmail.trim()) return toast.error("Enter an email address");
                    setPromoteLoading(true);
                    try {
                      const { data } = await axios.post("/api/admin/promote", { email: promoteEmail });
                      if (data.success) { toast.success(data.message); setPromoteEmail(""); }
                      else toast.error(data.error);
                    } catch (err: any) {
                      toast.error(err?.response?.data?.error ?? "Failed to promote user");
                    } finally { setPromoteLoading(false); }
                  }}
                  disabled={promoteLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#d98c2a] text-white text-sm rounded-lg hover:bg-[#c47020] disabled:opacity-60 transition-colors font-medium flex-shrink-0"
                >
                  {promoteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Make Admin
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 p-6 space-y-5">
              <h2 className="font-semibold text-neutral-900">Demote Admin to Customer</h2>
              <p className="text-sm text-neutral-500">
                Revoke admin access from a user and restore them to a regular customer account.
              </p>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={promoteEmail}
                  onChange={(e) => setPromoteEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors"
                />
                <button
                  onClick={async () => {
                    if (!promoteEmail.trim()) return toast.error("Enter an email address");
                    setPromoteLoading(true);
                    try {
                      const { data } = await axios.delete("/api/admin/promote", { data: { email: promoteEmail } });
                      if (data.success) { toast.success(data.message); setPromoteEmail(""); }
                      else toast.error(data.error);
                    } catch (err: any) {
                      toast.error(err?.response?.data?.error ?? "Failed to demote user");
                    } finally { setPromoteLoading(false); }
                  }}
                  disabled={promoteLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors font-medium flex-shrink-0"
                >
                  {promoteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Remove Admin
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
              <p className="font-semibold mb-1">Default Admin Account</p>
              <p>Email: <span className="font-mono font-medium">admin@mercyhomeessentials.com</span></p>
              <p className="mt-1 text-xs text-amber-700">This account was created by the seed script. Change its password from the Customers page or via the login page.</p>
            </div>
          </div>
        )}

        {/* Save button bottom */}
        <div className="flex justify-end pb-8">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#d98c2a] text-white rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors font-medium">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? "Saving…" : "Save All Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
