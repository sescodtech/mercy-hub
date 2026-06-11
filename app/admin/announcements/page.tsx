"use client";

import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Send, EyeOff, Loader2, X,
  Info, CheckCircle, AlertTriangle, Wrench, Sparkles,
  Mail, Bell, Users, Calendar, Clock, ChevronLeft,
  Eye, AlertCircle, CheckCheck,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils";

// ── Types ─────────────────────────────────────────────────────
type AnnouncementType     = "info"|"success"|"warning"|"maintenance"|"update";
type AnnouncementPriority = "low"|"normal"|"high"|"urgent";
type AnnouncementAudience = "all"|"customers"|"admins";
type View = "list" | "compose" | "preview";

interface Announcement {
  _id: string; title: string; body: string;
  type: AnnouncementType; priority: AnnouncementPriority; audience: AnnouncementAudience;
  sendEmail: boolean; sendInApp: boolean; isPublished: boolean;
  startDate: string; expiresAt: string | null; publishedAt: string | null;
  emailSentCount: number; emailSentAt: string | null;
  createdBy?: { name: string; email: string };
  createdAt: string;
}

type Draft = Omit<Announcement, "_id"|"publishedAt"|"emailSentCount"|"emailSentAt"|"createdBy"|"createdAt">;

// ── Constants ─────────────────────────────────────────────────
const TYPE_CONFIG: Record<AnnouncementType, { Icon: any; label: string; bg: string; text: string; border: string; previewBg: string }> = {
  info:        { Icon: Info,          label: "Info",        bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200",   previewBg: "bg-blue-50"   },
  success:     { Icon: CheckCircle,   label: "Success",     bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200",  previewBg: "bg-green-50"  },
  warning:     { Icon: AlertTriangle, label: "Warning",     bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200",  previewBg: "bg-amber-50"  },
  maintenance: { Icon: Wrench,        label: "Maintenance", bg: "bg-rose-100",   text: "text-rose-700",   border: "border-rose-200",   previewBg: "bg-rose-50"   },
  update:      { Icon: Sparkles,      label: "New Feature", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", previewBg: "bg-purple-50" },
};

const PRIORITY_CONFIG: Record<AnnouncementPriority, { label: string; badge: string; desc: string }> = {
  low:    { label: "Low",    badge: "bg-neutral-100 text-neutral-500", desc: "Informational, no banner"         },
  normal: { label: "Normal", badge: "bg-blue-100 text-blue-600",       desc: "Standard notification"            },
  high:   { label: "High",   badge: "bg-orange-100 text-orange-600",   desc: "Shows banner on dashboard"        },
  urgent: { label: "Urgent", badge: "bg-red-100 text-red-600",         desc: "Bold banner, requires attention"  },
};

const AUDIENCE_CONFIG: Record<AnnouncementAudience, { label: string; Icon: any; desc: string }> = {
  all:       { label: "Everyone",  Icon: Users,    desc: "All registered users"   },
  customers: { label: "Customers", Icon: Users,    desc: "Users with role: user"  },
  admins:    { label: "Admins",    Icon: Users,    desc: "Admin accounts only"     },
};

const EMPTY_DRAFT: Draft = {
  title: "", body: "", type: "info", priority: "normal", audience: "all",
  sendEmail: false, sendInApp: true, isPublished: false,
  startDate: new Date().toISOString().slice(0, 16), expiresAt: null,
};

// ── Small reusable components ─────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function SInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors" />
  );
}

function ToggleRow({ label, desc, checked, onChange }: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={cn("relative w-10 h-5 rounded-full transition-colors flex-shrink-0", checked ? "bg-[#d98c2a]" : "bg-neutral-300")}>
        <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

// ── Preview panel — shows exactly how users will see it ───────
function AnnouncementPreview({ draft }: { draft: Draft }) {
  const cfg = TYPE_CONFIG[draft.type];
  const { Icon } = cfg;
  const isHighPriority = draft.priority === "high" || draft.priority === "urgent";

  return (
    <div className="space-y-6">
      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Preview</p>

      {/* In-app notification preview */}
      {draft.sendInApp && (
        <div>
          <p className="text-xs text-neutral-400 mb-2 flex items-center gap-1.5"><Bell className="w-3 h-3" /> In-app notification (bell dropdown)</p>
          <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-900">Notifications</span>
                <span className="px-1.5 py-0.5 bg-[#d98c2a] text-white text-[10px] rounded-full font-bold">1</span>
              </div>
              <span className="text-xs text-[#d98c2a]">Mark all read</span>
            </div>
            <div className={cn("px-4 py-3.5", cfg.previewBg, "border-b border-neutral-50")}>
              <div className="flex gap-3 items-start">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", cfg.bg)}>
                  <Icon className={cn("w-4 h-4", cfg.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold text-neutral-900 leading-snug">
                      {draft.title || <span className="text-neutral-300 italic">Your title here…</span>}
                    </p>
                    <span className="w-2 h-2 rounded-full bg-[#d98c2a] flex-shrink-0 mt-1.5 ml-2" />
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">
                    {draft.body || <span className="italic">Your message body here…</span>}
                  </p>
                  <p className="text-[10px] text-neutral-300 mt-1.5">Just now</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 text-center text-xs text-neutral-300">— end of notifications —</div>
          </div>
        </div>
      )}

      {/* Banner preview (high/urgent priority) */}
      {draft.sendInApp && isHighPriority && (
        <div>
          <p className="text-xs text-neutral-400 mb-2 flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Dashboard banner (high/urgent priority)</p>
          <div className={cn("border rounded-xl overflow-hidden", cfg.bg, cfg.border)}>
            <div className="px-4 py-3 flex items-center gap-3">
              <Icon className={cn("w-5 h-5 flex-shrink-0", cfg.text)} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {draft.priority === "urgent" && (
                    <span className={cn("text-[10px] font-bold tracking-widest uppercase", cfg.text)}>URGENT</span>
                  )}
                  {draft.priority === "high" && (
                    <span className={cn("text-[10px] font-bold tracking-widest uppercase", cfg.text)}>IMPORTANT</span>
                  )}
                  <p className={cn("text-sm font-semibold", cfg.text)}>
                    {draft.title || <span className="italic opacity-50">Your title here…</span>}
                  </p>
                </div>
              </div>
              <X className={cn("w-4 h-4 opacity-50", cfg.text)} />
            </div>
          </div>
        </div>
      )}

      {/* Email preview */}
      {draft.sendEmail && (
        <div>
          <p className="text-xs text-neutral-400 mb-2 flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email notification</p>
          <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="bg-[#1a1108] px-6 py-5 text-center">
              <p className="font-serif text-lg font-semibold text-white">Mercy<span className="text-[#d98c2a]">Home</span></p>
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/30 mt-1">Essentials</p>
            </div>
            <div className="p-6">
              <span className={cn("inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide mb-4", cfg.bg, cfg.text)}>
                {cfg.label}
              </span>
              <h2 className="font-serif text-xl font-medium text-[#1a1108] mb-4 leading-snug">
                {draft.title || <span className="text-neutral-300 italic">Your title here…</span>}
              </h2>
              <p className="text-sm text-neutral-400 mb-3">Hi [Customer Name],</p>
              <div className="border-l-4 border-[#d98c2a] pl-4 py-1 bg-[#fdf8f0] rounded-r-lg">
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                  {draft.body || <span className="italic text-neutral-300">Your message body here…</span>}
                </p>
              </div>
              <div className="mt-6 text-center">
                <div className="inline-block px-6 py-3 bg-[#d98c2a] text-white text-sm font-semibold rounded-lg">Visit Our Store</div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-100 text-center">
              <p className="text-[11px] text-neutral-300">© 2025 Mercy Home Essentials · Lagos, Nigeria</p>
            </div>
          </div>
        </div>
      )}

      {!draft.sendEmail && !draft.sendInApp && (
        <div className="py-12 text-center border-2 border-dashed border-neutral-200 rounded-xl">
          <AlertCircle className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-sm text-neutral-400">Enable at least one delivery channel</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AdminAnnouncementsPage() {
  const [view,      setView]      = useState<View>("list");
  const [items,     setItems]     = useState<Announcement[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [draft,     setDraft]     = useState<Draft>(EMPTY_DRAFT);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [sending,   setSending]   = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchItems = async () => {
    try { const { data } = await axios.get("/api/admin/announcements"); setItems(data.data || []); }
    catch { toast.error("Failed to load announcements"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, []);

  const set = (k: keyof Draft, v: any) => setDraft(prev => ({ ...prev, [k]: v }));

  const openCompose = (existing?: Announcement) => {
    if (existing) {
      const { _id, publishedAt, emailSentCount, emailSentAt, createdBy, createdAt, ...rest } = existing;
      setDraft(rest);
      setEditId(_id);
    } else {
      setDraft(EMPTY_DRAFT);
      setEditId(null);
    }
    setShowPreview(false);
    setView("compose");
  };

  const saveDraft = async () => {
    if (!draft.title.trim() || !draft.body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    try {
      if (editId) {
        await axios.put(`/api/admin/announcements/${editId}`, { ...draft, isPublished: false });
      } else {
        await axios.post("/api/admin/announcements", { ...draft, isPublished: false });
      }
      toast.success("Saved as draft");
      setView("list");
      fetchItems();
    } catch (e: any) { toast.error(e?.response?.data?.error ?? "Save failed"); }
    finally { setSending(false); }
  };

  const sendNow = async () => {
    if (!draft.title.trim() || !draft.body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (!draft.sendEmail && !draft.sendInApp) {
      toast.error("Please enable at least one delivery channel (In-App or Email)");
      return;
    }

    const channels = [draft.sendInApp && "in-app notifications", draft.sendEmail && "emails"]
      .filter(Boolean).join(" and ");

    const confirmed = confirm(
      `Send this announcement now?\n\nThis will immediately deliver ${channels} to ${
        draft.audience === "all" ? "all users" :
        draft.audience === "customers" ? "all customers" : "all admins"
      }.\n\nThis cannot be undone.`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      if (editId) {
        await axios.put(`/api/admin/announcements/${editId}`, { ...draft, isPublished: true });
      } else {
        await axios.post("/api/admin/announcements", { ...draft, isPublished: true });
      }
      toast.success(`✅ Announcement sent! ${channels} delivered.`);
      setView("list");
      fetchItems();
    } catch (e: any) { toast.error(e?.response?.data?.error ?? "Send failed"); }
    finally { setSending(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try { await axios.delete(`/api/admin/announcements/${id}`); toast.success("Deleted"); fetchItems(); }
    catch { toast.error("Delete failed"); }
  };

  const togglePublish = async (item: Announcement) => {
    const action = item.isPublished ? "Unpublish" : "Publish now";
    if (!confirm(`${action} this announcement?${!item.isPublished ? "\n\nThis will send notifications to targeted users." : ""}`)) return;
    try {
      await axios.put(`/api/admin/announcements/${item._id}`, { ...item, isPublished: !item.isPublished });
      toast.success(item.isPublished ? "Unpublished" : "Published — notifications sent!");
      fetchItems();
    } catch { toast.error("Failed to update"); }
  };

  // ── COMPOSE VIEW ─────────────────────────────────────────────
  if (view === "compose") {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setView("list")}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{editId ? "Edit Announcement" : "New Announcement"}</h1>
            <p className="text-sm text-neutral-400">Compose your message and choose how to deliver it</p>
          </div>
          <button onClick={() => setShowPreview(!showPreview)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
              showPreview ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300")}>
            <Eye className="w-4 h-4" />
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
        </div>

        <div className={cn("grid gap-6", showPreview ? "lg:grid-cols-[1fr_420px]" : "max-w-2xl")}>
          {/* ── Compose Form ──────────────────────────────── */}
          <div className="space-y-5">

            {/* Step 1: Message */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-[#d98c2a] text-white text-xs flex items-center justify-center font-bold">1</div>
                <h2 className="font-semibold text-neutral-900">Write your message</h2>
              </div>

              <div>
                <FieldLabel required>Title / Subject</FieldLabel>
                <SInput value={draft.title} onChange={v => set("title", v)}
                  placeholder="e.g. Scheduled maintenance tonight at 2:00 AM" />
                <p className="text-xs text-neutral-400 mt-1">{draft.title.length}/200 characters</p>
              </div>

              <div>
                <FieldLabel required>Message Body</FieldLabel>
                <textarea
                  value={draft.body}
                  onChange={e => set("body", e.target.value)}
                  rows={7}
                  placeholder={"Write your full message here.\n\nYou can include:\n• Specific times or dates\n• Steps users need to take\n• Contact info for support"}
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none transition-colors leading-relaxed"
                />
              </div>
            </div>

            {/* Step 2: Type & Priority */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-[#d98c2a] text-white text-xs flex items-center justify-center font-bold">2</div>
                <h2 className="font-semibold text-neutral-900">Type & Priority</h2>
              </div>

              <div>
                <FieldLabel>Announcement Type</FieldLabel>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map(t => {
                    const cfg = TYPE_CONFIG[t];
                    const { Icon } = cfg;
                    return (
                      <button key={t} onClick={() => set("type", t)}
                        className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center",
                          draft.type === t ? `${cfg.bg} ${cfg.border} ${cfg.text}` : "border-neutral-200 text-neutral-500 hover:border-neutral-300")}>
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-semibold">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel>Priority Level</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PRIORITY_CONFIG) as AnnouncementPriority[]).map(p => {
                    const cfg = PRIORITY_CONFIG[p];
                    return (
                      <button key={p} onClick={() => set("priority", p)}
                        className={cn("flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                          draft.priority === p ? "border-[#d98c2a] bg-[#d98c2a]/5" : "border-neutral-200 hover:border-neutral-300")}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", cfg.badge)}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5">{cfg.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Audience */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-[#d98c2a] text-white text-xs flex items-center justify-center font-bold">3</div>
                <h2 className="font-semibold text-neutral-900">Target Audience</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(AUDIENCE_CONFIG) as AnnouncementAudience[]).map(a => {
                  const cfg = AUDIENCE_CONFIG[a];
                  return (
                    <button key={a} onClick={() => set("audience", a)}
                      className={cn("p-3 rounded-xl border-2 text-center transition-all",
                        draft.audience === a ? "border-[#d98c2a] bg-[#d98c2a]/5 text-[#d98c2a]" : "border-neutral-200 text-neutral-600 hover:border-neutral-300")}>
                      <p className="text-sm font-semibold">{cfg.label}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{cfg.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Delivery channels */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[#d98c2a] text-white text-xs flex items-center justify-center font-bold">4</div>
                <h2 className="font-semibold text-neutral-900">Delivery Channels</h2>
              </div>

              <div className="border border-neutral-100 rounded-xl divide-y divide-neutral-50">
                <div className="px-4 py-1">
                  <ToggleRow
                    label="In-App Notification"
                    desc="Bell icon badge + dropdown item visible to users when logged in. Polling every 60s."
                    checked={draft.sendInApp}
                    onChange={v => set("sendInApp", v)}
                  />
                </div>
                <div className="px-4 py-1">
                  <ToggleRow
                    label="Email Notification"
                    desc="Sends one email per targeted user via your SMTP settings. Sent in batches of 10."
                    checked={draft.sendEmail}
                    onChange={v => set("sendEmail", v)}
                  />
                </div>
              </div>

              {!draft.sendEmail && !draft.sendInApp && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Enable at least one channel to deliver this announcement.
                </div>
              )}
            </div>

            {/* Step 5: Schedule */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-[#d98c2a] text-white text-xs flex items-center justify-center font-bold">5</div>
                <h2 className="font-semibold text-neutral-900">Schedule (optional)</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Start Date</FieldLabel>
                  <SInput value={draft.startDate?.slice(0, 16) || ""} onChange={v => set("startDate", v)} type="datetime-local" />
                  <p className="text-xs text-neutral-400 mt-1">When this notification becomes visible</p>
                </div>
                <div>
                  <FieldLabel>Expiry Date</FieldLabel>
                  <SInput value={draft.expiresAt?.slice(0, 16) || ""} onChange={v => set("expiresAt", v || null)} type="datetime-local" />
                  <p className="text-xs text-neutral-400 mt-1">Leave empty for no expiry</p>
                </div>
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex gap-3">
              {/* Send Now — primary action */}
              <button
                onClick={sendNow}
                disabled={sending || !draft.title.trim() || !draft.body.trim() || (!draft.sendEmail && !draft.sendInApp)}
                className="flex-1 py-4 bg-[#d98c2a] text-white text-sm font-semibold rounded-xl hover:bg-[#c47020] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {sending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <><Send className="w-4 h-4" /> Send Announcement Now</>
                }
              </button>

              {/* Save as Draft */}
              <button
                onClick={saveDraft}
                disabled={sending || !draft.title.trim()}
                className="px-5 py-4 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl hover:bg-neutral-50 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                Save Draft
              </button>
            </div>

            {/* Delivery summary */}
            {(draft.sendEmail || draft.sendInApp) && draft.title && (
              <div className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-xl">
                <CheckCheck className="w-4 h-4 text-[#d98c2a] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-neutral-600 leading-relaxed">
                  <strong>Ready to send:</strong> "{draft.title}" will be delivered as{" "}
                  {[draft.sendInApp && "in-app notifications", draft.sendEmail && "emails"].filter(Boolean).join(" and ")}{" "}
                  to{" "}
                  {draft.audience === "all" ? "all users" : draft.audience === "customers" ? "all customer accounts" : "admin accounts only"}.
                  {(draft.priority === "high" || draft.priority === "urgent") && " A banner will appear on their dashboard."}
                </div>
              </div>
            )}
          </div>

          {/* ── Live Preview Panel ──────────────────────────── */}
          {showPreview && (
            <div className="lg:sticky lg:top-4 lg:self-start">
              <div className="bg-white rounded-2xl border border-neutral-100 p-5 overflow-y-auto max-h-[calc(100vh-120px)]">
                <AnnouncementPreview draft={draft} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Announcements</h1>
          <p className="text-sm text-neutral-400">
            {items.filter(i => i.isPublished).length} published · {items.filter(i => !i.isPublished).length} drafts
          </p>
        </div>
        <button
          onClick={() => openCompose()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <Bell className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
          <p className="text-neutral-500 font-medium">No announcements yet</p>
          <p className="text-neutral-400 text-sm mt-1 mb-6">Create your first announcement to notify your users</p>
          <button onClick={() => openCompose()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors">
            <Plus className="w-4 h-4" /> Create Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const cfg = TYPE_CONFIG[item.type];
            const { Icon } = cfg;
            return (
              <div key={item._id} className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                    <Icon className={cn("w-5 h-5", cfg.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                        item.isPublished ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500")}>
                        {item.isPublished ? "✓ Published" : "Draft"}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase", PRIORITY_CONFIG[item.priority].badge)}>
                        {item.priority}
                      </span>
                    </div>
                    <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                    <p className="text-sm text-neutral-500 line-clamp-1 mt-0.5">{item.body}</p>
                    <div className="flex items-center gap-4 text-xs text-neutral-400 mt-2 flex-wrap">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{AUDIENCE_CONFIG[item.audience].label}</span>
                      {item.sendInApp && <span className="flex items-center gap-1"><Bell className="w-3 h-3" />In-app</span>}
                      {item.sendEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {item.emailSentCount > 0 ? `${item.emailSentCount} emails sent` : "Email (not yet sent)"}
                        </span>
                      )}
                      {item.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />Expires {new Date(item.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.isPublished && item.publishedAt
                          ? `Sent ${new Date(item.publishedAt).toLocaleDateString()}`
                          : `Created ${new Date(item.createdAt).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!item.isPublished && (
                      <button onClick={() => togglePublish(item)}
                        title="Send now"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d98c2a] text-white text-xs font-medium rounded-lg hover:bg-[#c47020] transition-colors">
                        <Send className="w-3.5 h-3.5" /> Send
                      </button>
                    )}
                    {item.isPublished && (
                      <button onClick={() => togglePublish(item)} title="Unpublish"
                        className="p-2 text-neutral-400 hover:text-amber-500 transition-colors" title="Unpublish">
                        <EyeOff className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => openCompose(item)} className="p-2 text-neutral-400 hover:text-blue-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(item._id)} className="p-2 text-neutral-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
