"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Save, Loader2, Home, Image as ImageIcon, LayoutGrid,
  MessageSquare, ShieldCheck, Info, Plus, X, Upload,
  GripVertical, Eye, EyeOff, Star,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/utils";

type HomepageTab = "hero" | "sections" | "testimonials" | "trustbadges" | "about";

const TABS: { id: HomepageTab; label: string; Icon: any }[] = [
  { id: "hero",         label: "Hero",          Icon: Home },
  { id: "sections",     label: "Sections",      Icon: LayoutGrid },
  { id: "about",        label: "About",         Icon: Info },
  { id: "testimonials", label: "Testimonials",  Icon: MessageSquare },
  { id: "trustbadges",  label: "Trust Badges",  Icon: ShieldCheck },
];

const LUCIDE_ICONS = [
  "ShieldCheck", "Truck", "RotateCcw", "Headphones", "Star", "Heart",
  "Award", "CheckCircle", "Clock", "Package", "Gift", "Zap",
];

const DEFAULT_CMS = {
  hero: {
    headline: "Elevate Your Home",
    subheadline: "Discover premium home essentials crafted for modern Nigerian living.",
    ctaPrimaryText: "Shop Collection",
    ctaPrimaryUrl: "/shop",
    ctaSecondaryText: "",
    ctaSecondaryUrl: "",
    image: "",
    bgImage: "",
    overlay: true,
    overlayOpacity: 50,
    textPosition: "left" as const,
  },
  showFeatured: true,
  showBestSellers: true,
  showNewArrivals: true,
  showBanners: true,
  showTestimonials: true,
  showNewsletter: true,
  showWhyChooseUs: false,
  showTrustBadges: true,
  aboutTitle: "",
  aboutText: "",
  aboutImage: "",
  testimonials: [] as any[],
  trustBadges: [
    { icon: "Truck",       title: "Free Delivery",   text: "On orders over ₦50,000", active: true },
    { icon: "ShieldCheck", title: "Secure Payment",  text: "100% protected payments", active: true },
    { icon: "RotateCcw",   title: "Easy Returns",    text: "30-day return policy", active: true },
    { icon: "Headphones",  title: "24/7 Support",    text: "Dedicated support team", active: true },
  ] as any[],
  whyChooseUs: [] as any[],
  newsletterTitle: "Join the Mercy Family",
  newsletterSubtext: "Get 10% off your first order and early access to new arrivals.",
};

function Input({ label, value, onChange, placeholder, type = "text", note }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; note?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
      {note && <p className="text-xs text-neutral-400 mt-1">{note}</p>}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full flex-shrink-0 transition-colors ${checked ? "bg-[#d98c2a]" : "bg-neutral-300"}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export default function AdminHomepagePage() {
  const [tab,     setTab]     = useState<HomepageTab>("hero");
  const [cms,     setCms]     = useState(DEFAULT_CMS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const heroImgRef = useRef<HTMLInputElement>(null);
  const aboutImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get("/api/admin/settings");
        if (data.success && data.data.homepageCMS) {
          setCms({ ...DEFAULT_CMS, ...data.data.homepageCMS });
        }
      } catch { toast.error("Failed to load homepage settings"); }
      finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch("/api/admin/settings", { section: "homepageCMS", data: cms });
      toast.success("Homepage settings saved!");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const updHero = (key: string, val: unknown) =>
    setCms((c) => ({ ...c, hero: { ...c.hero, [key]: val } }));

  const uploadImage = async (field: "hero.image" | "hero.bgImage" | "aboutImage", file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "homepage");
      const { data } = await axios.post("/api/upload", fd);
      if (field === "aboutImage") {
        setCms((c) => ({ ...c, aboutImage: data.url }));
      } else if (field === "hero.image") {
        updHero("image", data.url);
      } else {
        updHero("bgImage", data.url);
      }
      toast.success("Image uploaded!");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  // Testimonials
  const addTestimonial = () =>
    setCms((c) => ({
      ...c,
      testimonials: [...c.testimonials, { name: "", role: "", text: "", rating: 5, avatar: "", active: true }],
    }));
  const removeTestimonial = (i: number) =>
    setCms((c) => ({ ...c, testimonials: c.testimonials.filter((_, j) => j !== i) }));
  const updTestimonial = (i: number, key: string, val: unknown) =>
    setCms((c) => {
      const t = [...c.testimonials];
      t[i] = { ...t[i], [key]: val };
      return { ...c, testimonials: t };
    });

  // Trust badges
  const addBadge = () =>
    setCms((c) => ({
      ...c,
      trustBadges: [...c.trustBadges, { icon: "Star", title: "", text: "", active: true }],
    }));
  const removeBadge = (i: number) =>
    setCms((c) => ({ ...c, trustBadges: c.trustBadges.filter((_, j) => j !== i) }));
  const updBadge = (i: number, key: string, val: unknown) =>
    setCms((c) => {
      const b = [...c.trustBadges];
      b[i] = { ...b[i], [key]: val };
      return { ...c, trustBadges: b };
    });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" /></div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Homepage CMS</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage all homepage content without touching code.</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Changes"}
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

      <div className="bg-white border border-neutral-100 rounded-2xl p-6 space-y-5">

        {/* ── HERO ── */}
        {tab === "hero" && (
          <>
            <h2 className="font-semibold text-neutral-800">Hero Section</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Headline" value={cms.hero.headline} onChange={(v) => updHero("headline", v)}
                  placeholder="Elevate Your Home" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Subheadline</label>
                <textarea value={cms.hero.subheadline} onChange={(e) => updHero("subheadline", e.target.value)}
                  rows={2} placeholder="Discover premium home essentials…"
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none" />
              </div>
              <Input label="Primary CTA Text" value={cms.hero.ctaPrimaryText} onChange={(v) => updHero("ctaPrimaryText", v)} placeholder="Shop Collection" />
              <Input label="Primary CTA URL"  value={cms.hero.ctaPrimaryUrl}  onChange={(v) => updHero("ctaPrimaryUrl", v)}  placeholder="/shop" />
              <Input label="Secondary CTA Text (optional)" value={cms.hero.ctaSecondaryText} onChange={(v) => updHero("ctaSecondaryText", v)} placeholder="View Deals" />
              <Input label="Secondary CTA URL"             value={cms.hero.ctaSecondaryUrl}  onChange={(v) => updHero("ctaSecondaryUrl", v)}  placeholder="/shop?filter=sale" />
            </div>

            {/* Text position */}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-2">Text Position</label>
              <div className="flex gap-2">
                {(["left", "center", "right"] as const).map((pos) => (
                  <button key={pos} onClick={() => updHero("textPosition", pos)}
                    className={cn("px-4 py-2 text-sm rounded-lg border transition-colors capitalize",
                      cms.hero.textPosition === pos ? "bg-[#d98c2a] text-white border-[#d98c2a]" : "border-neutral-200 text-neutral-600 hover:border-[#d98c2a]")}>
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-2">Hero Image</label>
              {cms.hero.image ? (
                <div className="relative group rounded-xl overflow-hidden h-40 bg-neutral-100">
                  <Image src={cms.hero.image} alt="Hero" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => heroImgRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-neutral-800 text-xs rounded-lg">
                      <Upload className="w-3 h-3" /> Replace
                    </button>
                    <button onClick={() => updHero("image", "")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg">
                      <X className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer w-full h-40 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-[#d98c2a] hover:text-[#d98c2a] transition-colors">
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-8 h-8" />}
                  <span className="text-sm">{uploading ? "Uploading…" : "Upload Hero Image"}</span>
                  <span className="text-xs">Recommended: 1400×900px</span>
                  <input ref={heroImgRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage("hero.image", f); }} />
                </label>
              )}
              <input ref={heroImgRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage("hero.image", f); }} />
            </div>

            {/* Overlay */}
            <Toggle label="Dark Overlay" desc="Add a dark overlay to improve text readability on the hero image"
              checked={cms.hero.overlay} onChange={(v) => updHero("overlay", v)} />
            {cms.hero.overlay && (
              <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-2">
                  Overlay Opacity: {cms.hero.overlayOpacity}%
                </label>
                <input type="range" min={0} max={90} value={cms.hero.overlayOpacity}
                  onChange={(e) => updHero("overlayOpacity", Number(e.target.value))}
                  className="w-full accent-[#d98c2a]" />
              </div>
            )}
          </>
        )}

        {/* ── SECTIONS ── */}
        {tab === "sections" && (
          <>
            <h2 className="font-semibold text-neutral-800">Homepage Sections Visibility</h2>
            <p className="text-sm text-neutral-400 -mt-3">Toggle which sections appear on the homepage.</p>
            <Toggle label="Featured Products"  desc="Show handpicked featured products"         checked={cms.showFeatured}    onChange={(v) => setCms((c) => ({ ...c, showFeatured: v }))} />
            <Toggle label="Best Sellers"       desc="Show best-selling products section"         checked={cms.showBestSellers} onChange={(v) => setCms((c) => ({ ...c, showBestSellers: v }))} />
            <Toggle label="New Arrivals"       desc="Show latest new arrival products"           checked={cms.showNewArrivals} onChange={(v) => setCms((c) => ({ ...c, showNewArrivals: v }))} />
            <Toggle label="Promotional Banners" desc="Show the mid-page banner section"          checked={cms.showBanners}     onChange={(v) => setCms((c) => ({ ...c, showBanners: v }))} />
            <Toggle label="Trust Badges"       desc="Show shipping/payment/returns trust icons"  checked={cms.showTrustBadges} onChange={(v) => setCms((c) => ({ ...c, showTrustBadges: v }))} />
            <Toggle label="Testimonials"       desc="Show customer testimonials section"         checked={cms.showTestimonials} onChange={(v) => setCms((c) => ({ ...c, showTestimonials: v }))} />
            <Toggle label="Newsletter Section" desc="Show email subscribe section"               checked={cms.showNewsletter}  onChange={(v) => setCms((c) => ({ ...c, showNewsletter: v }))} />
            <Toggle label="Why Choose Us"      desc="Show the why choose us / features section"  checked={cms.showWhyChooseUs} onChange={(v) => setCms((c) => ({ ...c, showWhyChooseUs: v }))} />

            <div className="pt-4 border-t border-neutral-100">
              <h3 className="font-semibold text-neutral-700 mb-3">Newsletter Content</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Newsletter Headline" value={cms.newsletterTitle}
                  onChange={(v) => setCms((c) => ({ ...c, newsletterTitle: v }))}
                  placeholder="Join the Mercy Family" />
                <Input label="Newsletter Subtext" value={cms.newsletterSubtext}
                  onChange={(v) => setCms((c) => ({ ...c, newsletterSubtext: v }))}
                  placeholder="Get 10% off your first order…" />
              </div>
            </div>
          </>
        )}

        {/* ── ABOUT ── */}
        {tab === "about" && (
          <>
            <h2 className="font-semibold text-neutral-800">About Section</h2>
            <Input label="Section Title" value={cms.aboutTitle}
              onChange={(v) => setCms((c) => ({ ...c, aboutTitle: v }))}
              placeholder="About Mercy Home Essentials" />
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">About Text</label>
              <textarea value={cms.aboutText} onChange={(e) => setCms((c) => ({ ...c, aboutText: e.target.value }))}
                rows={5} placeholder="Tell your brand story here…"
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-2">About Image</label>
              {cms.aboutImage ? (
                <div className="relative group rounded-xl overflow-hidden h-40 bg-neutral-100">
                  <Image src={cms.aboutImage} alt="About" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => aboutImgRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-xs rounded-lg">Replace</button>
                    <button onClick={() => setCms((c) => ({ ...c, aboutImage: "" }))}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg">Remove</button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer w-full h-40 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:border-[#d98c2a] hover:text-[#d98c2a] transition-colors">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">Upload About Image</span>
                  <input ref={aboutImgRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage("aboutImage", f); }} />
                </label>
              )}
              <input ref={aboutImgRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage("aboutImage", f); }} />
            </div>
          </>
        )}

        {/* ── TESTIMONIALS ── */}
        {tab === "testimonials" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-neutral-800">Customer Testimonials</h2>
              <button onClick={addTestimonial}
                className="flex items-center gap-1.5 text-sm text-[#d98c2a] hover:text-[#c47020] font-medium">
                <Plus className="w-4 h-4" /> Add Testimonial
              </button>
            </div>

            {cms.testimonials.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-neutral-200 rounded-xl">
                <MessageSquare className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                <p className="text-sm text-neutral-400">No testimonials yet</p>
                <button onClick={addTestimonial} className="mt-2 text-xs text-[#d98c2a] hover:underline">
                  Add your first testimonial
                </button>
              </div>
            )}

            <div className="space-y-4">
              {cms.testimonials.map((t, i) => (
                <div key={i} className="border border-neutral-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-neutral-300" />
                      <span className="text-sm font-medium text-neutral-700">
                        {t.name || <span className="text-neutral-400 italic">Untitled</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updTestimonial(i, "active", !t.active)}
                        className="p-1 text-neutral-400 hover:text-neutral-700">
                        {t.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => removeTestimonial(i)}
                        className="p-1 text-neutral-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input label="Name" value={t.name} onChange={(v) => updTestimonial(i, "name", v)} placeholder="Adaeze Okonkwo" />
                    <Input label="Role/Location" value={t.role} onChange={(v) => updTestimonial(i, "role", v)} placeholder="Lagos, Nigeria" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Review Text</label>
                    <textarea value={t.text} onChange={(e) => updTestimonial(i, "text", e.target.value)}
                      rows={2} placeholder="Write the customer review here…"
                      className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-2">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => updTestimonial(i, "rating", n)}>
                          <Star className={cn("w-5 h-5", n <= t.rating ? "text-[#d98c2a] fill-[#d98c2a]" : "text-neutral-200")} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TRUST BADGES ── */}
        {tab === "trustbadges" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-neutral-800">Trust Badges</h2>
              <button onClick={addBadge}
                className="flex items-center gap-1.5 text-sm text-[#d98c2a] hover:text-[#c47020] font-medium">
                <Plus className="w-4 h-4" /> Add Badge
              </button>
            </div>

            <div className="space-y-3">
              {cms.trustBadges.map((b, i) => (
                <div key={i} className="border border-neutral-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-neutral-300" />
                      <span className="text-sm font-medium text-neutral-700">
                        {b.title || <span className="text-neutral-400 italic">Untitled badge</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updBadge(i, "active", !b.active)}
                        className="p-1 text-neutral-400 hover:text-neutral-700">
                        {b.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => removeBadge(i)}
                        className="p-1 text-neutral-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">Icon</label>
                      <select value={b.icon} onChange={(e) => updBadge(i, "icon", e.target.value)}
                        className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]">
                        {LUCIDE_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                      </select>
                    </div>
                    <Input label="Title" value={b.title} onChange={(v) => updBadge(i, "title", v)} placeholder="Free Delivery" />
                    <Input label="Subtitle" value={b.text} onChange={(v) => updBadge(i, "text", v)} placeholder="On orders over ₦50,000" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
