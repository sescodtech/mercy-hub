"use client";

import { useState, useEffect, useRef } from "react";
import { useSession }                   from "next-auth/react";
import { useRouter }                    from "next/navigation";
import Link                             from "next/link";
import Image                            from "next/image";
import {
  ArrowLeft, User, Shield, Camera, Loader2, Save,
  Eye, EyeOff, Check, X, Mail, Phone, Lock,
} from "lucide-react";
import axios      from "axios";
import toast      from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────
type ProfileTab = "info" | "security";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function initials(name: string) {
  return (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const len   = value.length;
  const score = len < 8 ? 1 : len < 12 ? 2 : 3;
  const color = score === 1 ? "bg-red-400" : score === 2 ? "bg-yellow-400" : "bg-green-500";
  const label = score === 1 ? "Too short" : score === 2 ? "Good" : "Strong";
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= score ? color : "bg-neutral-200"}`} />
        ))}
      </div>
      <span className="text-[11px] text-neutral-400">{label}</span>
    </div>
  );
}

// ─── Password input with show/hide toggle ─────────────────────
function PasswordInput({
  label, value, onChange, placeholder, show, onToggle, suffix,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; show: boolean; onToggle: () => void;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm border border-neutral-200 rounded-xl pl-10 pr-20 py-3 outline-none focus:border-[#d98c2a] transition-colors"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {suffix}
          <button type="button" onClick={onToggle} className="text-neutral-400 hover:text-neutral-600">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ProfileSettingsPage() {
  const { data: session, status } = useSession();
  const router                     = useRouter();

  const [activeTab, setActiveTab] = useState<ProfileTab>("info");
  const [profile,   setProfile]   = useState<UserProfile | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Personal info state ──────────────────────────────────────
  const [name,   setName]   = useState("");
  const [phone,  setPhone]  = useState("");
  const [avatar, setAvatar] = useState("");

  // ── Security state ───────────────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConf,   setShowConf]   = useState(false);

  const fileRef = useRef<HTMLInputElement | null>(null);

  // ── Auth guard ───────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/dashboard/profile");
    }
  }, [status, router]);

  // ── Load user profile ────────────────────────────────────────
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const { data } = await axios.get("/api/users");
        if (data.success) {
          const u = data.data as UserProfile;
          setProfile(u);
          setName(u.name   || "");
          setPhone(u.phone  || "");
          setAvatar(u.avatar || "");
        } else {
          toast.error("Could not load your profile.");
        }
      } catch {
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  // ── Avatar upload ─────────────────────────────────────────────
  const handleAvatarChange = async (file: File) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");
      const { data } = await axios.post("/api/upload", fd);
      if (data.url) {
        setAvatar(data.url);
        // Also save to DB immediately so it's persisted
        await axios.put("/api/users", { avatar: data.url });
        toast.success("Profile photo updated!");
      } else {
        toast.error("Upload failed — try again.");
      }
    } catch {
      toast.error("Upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  };

  // ── Save personal info ────────────────────────────────────────
  const handleSaveInfo = async () => {
    if (!name.trim()) { toast.error("Name cannot be empty."); return; }
    setSaving(true);
    try {
      const { data } = await axios.put("/api/users", {
        name:   name.trim(),
        phone:  phone.trim() || undefined,
        avatar: avatar       || undefined,
      });
      if (data.success) {
        toast.success("Profile saved!");
        setProfile((prev) =>
          prev
            ? { ...prev, name: data.data.name, phone: data.data.phone ?? "", avatar: data.data.avatar ?? "" }
            : prev
        );
      } else {
        toast.error(data.error || "Failed to save profile.");
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPw)              { toast.error("Enter your current password.");         return; }
    if (!newPw)                  { toast.error("Enter a new password.");                return; }
    if (newPw.length < 8)        { toast.error("New password must be 8+ characters.");  return; }
    if (newPw !== confirmPw)     { toast.error("Passwords don't match.");               return; }
    if (newPw === currentPw)     { toast.error("New password must differ from current."); return; }

    setSaving(true);
    try {
      const { data } = await axios.put("/api/users", {
        currentPassword: currentPw,
        newPassword:     newPw,
      });
      if (data.success) {
        toast.success("Password changed successfully!");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } else {
        toast.error(data.error || "Password change failed.");
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" />
      </div>
    );
  }

  const displayName  = name  || session?.user?.name  || "";
  const displayEmail = profile?.email || session?.user?.email || "";
  const canSaveInfo  = !saving && !!displayName.trim();
  const canChangePw  = !saving && !!currentPw && !!newPw && newPw.length >= 8 && newPw === confirmPw;

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-semibold text-neutral-900">Profile Settings</h1>
              <p className="text-sm text-neutral-400 mt-0.5">Manage your info and account security</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-site py-8 max-w-2xl space-y-6">

        {/* ── Avatar + Name Card ── */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#d98c2a]/10 flex items-center justify-center">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={displayName}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                    unoptimized={avatar.startsWith("https://res.cloudinary.com")}
                  />
                ) : (
                  <span className="text-2xl font-bold text-[#d98c2a]">
                    {initials(displayName)}
                  </span>
                )}
              </div>
              {/* Camera button */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                title="Change profile photo"
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#d98c2a] rounded-lg flex items-center justify-center shadow-md hover:bg-[#c47020] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploading
                  ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-white" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarChange(f);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Name + email + status */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-900 text-lg leading-tight truncate">
                {displayName || "—"}
              </p>
              <p className="text-sm text-neutral-400 mt-0.5 truncate">{displayEmail}</p>
              <div className="flex items-center flex-wrap gap-2 mt-2">
                {profile?.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                )}
                <span className="text-[11px] text-neutral-400">
                  Member since {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString("en-NG", { month: "short", year: "numeric" })
                    : "—"}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-4 pl-1">
            Click the camera icon to update your profile photo. Max 5 MB · JPEG, PNG or WebP.
          </p>
        </div>

        {/* ── Tab switcher ── */}
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
          {(
            [
              { id: "info",     label: "Personal Info", Icon: User   },
              { id: "security", label: "Security",      Icon: Shield },
            ] as { id: ProfileTab; label: string; Icon: typeof User }[]
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ────────────────────────── PERSONAL INFO TAB ────────────────────────── */}
        {activeTab === "info" && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">

            {/* Full name */}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full text-sm border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#d98c2a] transition-colors"
                />
              </div>
            </div>

            {/* Email — read-only */}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                <input
                  type="email"
                  value={displayEmail}
                  disabled
                  className="w-full text-sm border border-neutral-100 bg-neutral-50 rounded-xl pl-10 pr-4 py-3 text-neutral-400 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-1.5">Email address cannot be changed.</p>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide block mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                  maxLength={14}
                  className="w-full text-sm border border-neutral-200 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-[#d98c2a] transition-colors"
                />
              </div>
            </div>

            {/* Save button */}
            <div className="pt-1">
              <button
                onClick={handleSaveInfo}
                disabled={!canSaveInfo}
                className="flex items-center gap-2 px-6 py-3 bg-[#d98c2a] text-white text-sm font-semibold rounded-xl hover:bg-[#c47020] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────── SECURITY TAB ────────────────────────── */}
        {activeTab === "security" && (
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-neutral-900 mb-0.5">Change Password</p>
              <p className="text-xs text-neutral-400">
                Choose a strong password with at least 8 characters.
              </p>
            </div>

            <div className="space-y-4 pt-1">
              {/* Current password */}
              <PasswordInput
                label="Current Password"
                value={currentPw}
                onChange={setCurrentPw}
                placeholder="Enter current password"
                show={showCur}
                onToggle={() => setShowCur((v) => !v)}
              />

              {/* New password */}
              <div>
                <PasswordInput
                  label="New Password"
                  value={newPw}
                  onChange={setNewPw}
                  placeholder="Min. 8 characters"
                  show={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                />
                <PasswordStrength value={newPw} />
              </div>

              {/* Confirm password */}
              <PasswordInput
                label="Confirm New Password"
                value={confirmPw}
                onChange={setConfirmPw}
                placeholder="Repeat new password"
                show={showConf}
                onToggle={() => setShowConf((v) => !v)}
                suffix={
                  confirmPw ? (
                    confirmPw === newPw
                      ? <Check className="w-4 h-4 text-green-500" />
                      : <X className="w-4 h-4 text-red-400" />
                  ) : undefined
                }
              />
            </div>

            {/* Change password button */}
            <div className="pt-1">
              <button
                onClick={handleChangePassword}
                disabled={!canChangePw}
                className="flex items-center gap-2 px-6 py-3 bg-[#d98c2a] text-white text-sm font-semibold rounded-xl hover:bg-[#c47020] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Shield className="w-4 h-4" />}
                Update Password
              </button>
            </div>

            {/* Note for Google-auth users */}
            <p className="text-xs text-neutral-400 border-t border-neutral-100 pt-4">
              If you signed in with Google, you may not have a password set. Use the form above
              to create one, and enter any value in "Current Password" — the server will handle it.
            </p>
          </div>
        )}

        {/* ── Quick nav ── */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Quick Links</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/dashboard"          className="text-[#d98c2a] hover:underline">Dashboard</Link>
            <Link href="/dashboard/orders"   className="text-neutral-500 hover:text-neutral-700 hover:underline">My Orders</Link>
            <Link href="/dashboard/wishlist" className="text-neutral-500 hover:text-neutral-700 hover:underline">Wishlist</Link>
            <Link href="/shop"               className="text-neutral-500 hover:text-neutral-700 hover:underline">Shop</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
