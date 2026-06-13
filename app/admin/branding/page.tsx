"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Save, Loader2, Upload, X, Building2, Share2,
  Search, Image as ImageIcon,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/utils";

type BrandingTab = "logos" | "company" | "social" | "seo";

const TABS: { id: BrandingTab; label: string; Icon: any }[] = [
  { id: "logos",   label: "Logos & Favicon", Icon: ImageIcon },
  { id: "company", label: "Company Info",    Icon: Building2 },
  { id: "social",  label: "Social Media",    Icon: Share2 },
  { id: "seo",     label: "SEO & Meta",      Icon: Search },
];

const LOGO_FIELDS = [
  { key: "desktop", label: "Desktop Logo",     desc: "Shown in the main navbar on desktop" },
  { key: "mobile",  label: "Mobile Logo",      desc: "Shown on smaller screens" },
  { key: "footer",  label: "Footer Logo",      desc: "Displayed in the site footer" },
  { key: "admin",   label: "Admin Panel Logo", desc: "Top-left logo inside the admin sidebar" },
  { key: "email",   label: "Email Logo",       desc: "Used in transactional email headers" },
  { key: "favicon", label: "Favicon",          desc: "Browser tab icon (32×32 or 64×64 PNG)" },
];

const SOCIAL_FIELDS = [
  { key: "facebook",  label: "Facebook",  placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "twitter",   label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  { key: "linkedin",  label: "LinkedIn",  placeholder: "https://linkedin.com/company/..." },
  { key: "youtube",   label: "YouTube",   placeholder: "https://youtube.com/@yourchannel" },
  { key: "tiktok",    label: "TikTok",    placeholder: "https://tiktok.com/@yourhandle" },
];

const defaultLogos = { desktop: "", mobile: "", footer: "", admin: "", email: "", favicon: "" };
const defaultSEO   = { metaTitle: "", metaDescription: "", ogImage: "", twitterCard: "", keywords: "" };
const defaultSocial = { facebook: "", instagram: "", twitter: "", linkedin: "", youtube: "", tiktok: "" };

function Input({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]"
      />
    </div>
  );
}

export default function AdminBrandingPage() {
  const [tab,     setTab]     = useState<BrandingTab>("logos");
  const [logos,   setLogos]   = useState(defaultLogos);
  const [company, setCompany] = useState({
    businessName: "Mercy Home Essentials", tagline: "", email: "",
    supportEmail: "", whatsapp: "", phone: "",
    address: { street: "", city: "", state: "", country: "Nigeria", postalCode: "" },
  });
  const [social,  setSocial]  = useState(defaultSocial);
  const [seo,     setSEO]     = useState(defaultSEO);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/api/admin/settings");
        if (data.success) {
          const d = data.data;
          setLogos({ ...defaultLogos, ...d.logos });
          setCompany({
            businessName: d.businessName ?? "Mercy Home Essentials",
            tagline: d.tagline ?? "",
            email: d.email ?? "",
            supportEmail: d.supportEmail ?? "",
            whatsapp: d.whatsapp ?? "",
            phone: d.phone?.[0] ?? "",
            address: { street: "", city: "", state: "", country: "Nigeria", postalCode: "", ...d.address },
          });
          setSocial({ ...defaultSocial, ...d.social });
          setSEO({ ...defaultSEO, ...d.seo });
        }
      } catch { toast.error("Failed to load branding settings"); }
      finally { setLoading(false); }
    })();
  }, []);

  const uploadLogo = async (key: string, file: File) => {
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "branding");
      const { data } = await axios.post("/api/upload", fd);
      setLogos((l) => ({ ...l, [key]: data.url }));
      toast.success("Logo uploaded!");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(null); }
  };

  const removeLogo = (key: string) => setLogos((l) => ({ ...l, [key]: "" }));

  const save = async () => {
    setSaving(true);
    try {
      // Save logos
      await axios.patch("/api/admin/settings", { section: "logos", data: logos });
      // Save seo section
      await axios.patch("/api/admin/settings", { section: "seo", data: seo });
      // Save social
      await axios.patch("/api/admin/settings", { section: "social", data: social });
      // Save company via full PUT to root fields
      await axios.put("/api/admin/settings", {
        businessName: company.businessName,
        tagline:      company.tagline,
        email:        company.email,
        supportEmail: company.supportEmail,
        whatsapp:     company.whatsapp,
        phone:        company.phone ? [company.phone] : [],
        address:      company.address,
        // sync legacy logo field with desktop logo
        logo:         logos.desktop,
        favicon:      logos.favicon,
      });
      toast.success("Branding saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" /></div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Branding & Identity</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage logos, company info, social links, and SEO meta tags.</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-neutral-100 rounded-xl p-1.5 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              tab === id ? "bg-[#d98c2a] text-white" : "text-neutral-600 hover:bg-neutral-50")}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-neutral-100 rounded-2xl p-6 space-y-6">

        {/* ── LOGOS ── */}
        {tab === "logos" && (
          <>
            <h2 className="font-semibold text-neutral-800">Logos & Favicon</h2>
            <p className="text-sm text-neutral-400 -mt-3">
              Upload logos for each context. PNG or SVG recommended. Recommended size: 240×60px for logos.
            </p>
            <div className="grid sm:grid-cols-2 gap-5">
              {LOGO_FIELDS.map(({ key, label, desc }) => (
                <div key={key} className="border border-neutral-200 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">{label}</p>
                    <p className="text-xs text-neutral-400">{desc}</p>
                  </div>

                  {(logos as any)[key] ? (
                    <div className="relative group">
                      <div className="w-full h-20 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center p-2">
                        <Image
                          src={(logos as any)[key]}
                          alt={label}
                          width={160}
                          height={60}
                          className="object-contain max-h-16 w-auto"
                        />
                      </div>
                      <button
                        onClick={() => removeLogo(key)}
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="w-full h-20 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-1.5 text-neutral-400 hover:border-[#d98c2a] hover:text-[#d98c2a] transition-colors cursor-pointer"
                      onClick={() => fileRefs.current[key]?.click()}
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-xs">Click to upload</span>
                    </div>
                  )}

                  <input
                    ref={(el) => { fileRefs.current[key] = el; }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadLogo(key, file);
                    }}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => fileRefs.current[key]?.click()}
                      disabled={uploading === key}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-[#d98c2a] text-[#d98c2a] rounded-lg hover:bg-[#d98c2a]/5 disabled:opacity-50"
                    >
                      {uploading === key
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Upload className="w-3 h-3" />}
                      {uploading === key ? "Uploading…" : "Upload"}
                    </button>
                    {(logos as any)[key] && (
                      <button
                        onClick={() => removeLogo(key)}
                        className="px-3 py-2 text-xs border border-red-200 text-red-400 rounded-lg hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── COMPANY ── */}
        {tab === "company" && (
          <>
            <h2 className="font-semibold text-neutral-800">Company Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Business Name" value={company.businessName} onChange={(v) => setCompany((c) => ({ ...c, businessName: v }))} />
              <Input label="Tagline" value={company.tagline} onChange={(v) => setCompany((c) => ({ ...c, tagline: v }))} placeholder="Premium Home Goods" />
              <Input label="Business Email" value={company.email} onChange={(v) => setCompany((c) => ({ ...c, email: v }))} type="email" placeholder="hello@mercyhomeessentials.com" />
              <Input label="Support Email" value={company.supportEmail} onChange={(v) => setCompany((c) => ({ ...c, supportEmail: v }))} type="email" placeholder="support@mercyhomeessentials.com" />
              <Input label="Phone Number" value={company.phone} onChange={(v) => setCompany((c) => ({ ...c, phone: v }))} placeholder="+234 903 424 0648" />
              <Input label="WhatsApp Number" value={company.whatsapp} onChange={(v) => setCompany((c) => ({ ...c, whatsapp: v }))} placeholder="+2348012345678" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Office Address</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Street Address" value={company.address.street} onChange={(v) => setCompany((c) => ({ ...c, address: { ...c.address, street: v } }))} />
                <Input label="City" value={company.address.city} onChange={(v) => setCompany((c) => ({ ...c, address: { ...c.address, city: v } }))} />
                <Input label="State" value={company.address.state} onChange={(v) => setCompany((c) => ({ ...c, address: { ...c.address, state: v } }))} />
                <Input label="Country" value={company.address.country} onChange={(v) => setCompany((c) => ({ ...c, address: { ...c.address, country: v } }))} />
              </div>
            </div>
          </>
        )}

        {/* ── SOCIAL ── */}
        {tab === "social" && (
          <>
            <h2 className="font-semibold text-neutral-800">Social Media Links</h2>
            <p className="text-sm text-neutral-400 -mt-3">These links appear in the footer and other components automatically.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                <Input
                  key={key}
                  label={label}
                  value={(social as any)[key]}
                  onChange={(v) => setSocial((s) => ({ ...s, [key]: v }))}
                  placeholder={placeholder}
                />
              ))}
            </div>
          </>
        )}

        {/* ── SEO ── */}
        {tab === "seo" && (
          <>
            <h2 className="font-semibold text-neutral-800">SEO & Metadata</h2>
            <Input label="Default Meta Title" value={seo.metaTitle} onChange={(v) => setSEO((s) => ({ ...s, metaTitle: v }))} placeholder="Mercy Home Essentials — Premium Home Goods" />
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Meta Description</label>
              <textarea
                value={seo.metaDescription}
                onChange={(e) => setSEO((s) => ({ ...s, metaDescription: e.target.value }))}
                rows={3}
                placeholder="Discover premium home essentials crafted for modern living."
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none"
              />
              <p className="text-xs text-neutral-400 mt-1">{seo.metaDescription.length}/160 characters</p>
            </div>
            <Input label="SEO Keywords (comma-separated)" value={seo.keywords} onChange={(v) => setSEO((s) => ({ ...s, keywords: v }))} placeholder="home essentials, Nigeria, premium bedding, kitchenware" />

            <div className="border-t border-neutral-100 pt-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Open Graph / Social Sharing</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">OG Image</label>
                  {seo.ogImage
                    ? (
                      <div className="relative group">
                        <Image src={seo.ogImage} alt="OG Image" width={300} height={157} className="rounded-lg border border-neutral-200 object-cover w-full h-32" />
                        <button onClick={() => setSEO((s) => ({ ...s, ogImage: "" }))}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                    : (
                      <label className="cursor-pointer w-full h-32 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-[#d98c2a] hover:text-[#d98c2a] transition-colors">
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">Upload OG Image (1200×630)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const fd = new FormData(); fd.append("file", file); fd.append("folder", "branding");
                          const { data } = await axios.post("/api/upload", fd);
                          setSEO((s) => ({ ...s, ogImage: data.url }));
                        }} />
                      </label>
                    )
                  }
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Twitter Card Image</label>
                  {seo.twitterCard
                    ? (
                      <div className="relative group">
                        <Image src={seo.twitterCard} alt="Twitter Card" width={300} height={157} className="rounded-lg border border-neutral-200 object-cover w-full h-32" />
                        <button onClick={() => setSEO((s) => ({ ...s, twitterCard: "" }))}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                    : (
                      <label className="cursor-pointer w-full h-32 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-[#d98c2a] hover:text-[#d98c2a] transition-colors">
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">Upload Twitter Card (1200×628)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const fd = new FormData(); fd.append("file", file); fd.append("folder", "branding");
                          const { data } = await axios.post("/api/upload", fd);
                          setSEO((s) => ({ ...s, twitterCard: data.url }));
                        }} />
                      </label>
                    )
                  }
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
