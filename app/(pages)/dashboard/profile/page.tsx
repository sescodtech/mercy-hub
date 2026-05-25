"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User, Mail, Phone, MapPin, Lock, Camera,
  Loader2, CheckCircle, Eye, EyeOff, Save,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/utils";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  addresses?: {
    _id: string;
    label: string;
    firstName: string;
    lastName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
    isDefault: boolean;
  }[];
}

type Tab = "profile" | "security" | "addresses";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab,       setTab]       = useState<Tab>("profile");
  const [profile,   setProfile]   = useState<UserProfile | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile form
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw,    setShowPw]    = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?callbackUrl=/dashboard/profile");
    }
  }, [status, router]);

  // Load profile
  useEffect(() => {
    if (status !== "authenticated") return;
    axios.get("/api/user/profile")
      .then(({ data }) => {
        if (data.success) {
          setProfile(data.data);
          setName(data.data.name ?? "");
          setPhone(data.data.phone ?? "");
        }
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [status]);

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");
      const { data } = await axios.post("/api/upload", fd);
      if (data.success) {
        await axios.put("/api/user/profile", { avatar: data.url });
        setProfile((p) => p ? { ...p, avatar: data.url } : p);
        await update({ avatar: data.url });
        toast.success("Avatar updated!");
      }
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };

  const saveProfile = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const { data } = await axios.put("/api/user/profile", { name, phone });
      if (data.success) {
        setProfile(data.data);
        await update({ name });
        toast.success("Profile updated!");
      }
    } catch { toast.error("Failed to update profile"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { toast.error("Fill in all password fields"); return; }
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    try {
      const { data } = await axios.put("/api/user/profile", {
        currentPassword: currentPw,
        newPassword:     newPw,
      });
      if (data.success) {
        toast.success("Password changed successfully!");
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Failed to change password");
    } finally { setSaving(false); }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Failed to load profile</p>
          <button onClick={() => window.location.reload()}
            className="text-sm text-[#d98c2a] hover:underline">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-5">
          <h1 className="font-display text-2xl font-semibold text-neutral-900">My Profile</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage your account settings</p>
        </div>
      </div>

      <div className="container-site py-10">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Avatar */}
            <div className="bg-white rounded-2xl border border-neutral-100 p-6 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-[#d98c2a]/10 border-2 border-[#d98c2a]/20">
                  {profile.avatar ? (
                    <Image src={profile.avatar} alt={profile.name} width={80} height={80} className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#d98c2a]">
                        {profile.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-[#d98c2a] rounded-full flex items-center justify-center text-white shadow-sm hover:bg-[#c47020] transition-colors"
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </div>
              <h3 className="font-semibold text-neutral-900">{profile.name}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{profile.email}</p>
              {profile.isVerified && (
                <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" /> Verified account
                </div>
              )}
            </div>

            {/* Nav tabs */}
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              {([
                { id: "profile",   label: "Personal Info",  icon: User },
                { id: "security",  label: "Security",       icon: Lock },
                { id: "addresses", label: "Addresses",      icon: MapPin },
              ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors text-left border-b border-neutral-50 last:border-0",
                    tab === id ? "bg-[#d98c2a]/5 text-[#d98c2a] font-medium" : "text-neutral-600 hover:bg-neutral-50"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">

            {/* Profile tab */}
            {tab === "profile" && (
              <div className="space-y-5">
                <h2 className="font-semibold text-neutral-900">Personal Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg outline-none focus:border-[#d98c2a]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input value={profile.email} disabled
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-400 cursor-not-allowed" />
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 801 234 5678" type="tel"
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg outline-none focus:border-[#d98c2a]" />
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-neutral-400 mb-3">
                      Member since {new Date(profile.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
                    </p>
                    <button onClick={saveProfile} disabled={saving}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security tab */}
            {tab === "security" && (
              <div className="space-y-5">
                <h2 className="font-semibold text-neutral-900">Change Password</h2>
                <div className="space-y-4 max-w-md">
                  {[
                    { label: "Current Password", value: currentPw, setter: setCurrentPw },
                    { label: "New Password",     value: newPw,     setter: setNewPw },
                    { label: "Confirm Password", value: confirmPw, setter: setConfirmPw },
                  ].map(({ label, value, setter }) => (
                    <div key={label}>
                      <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">{label}</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type={showPw ? "text" : "password"}
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 text-sm border border-neutral-200 rounded-lg outline-none focus:border-[#d98c2a]"
                        />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={changePassword} disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {saving ? "Updating…" : "Update Password"}
                  </button>
                </div>
              </div>
            )}

            {/* Addresses tab */}
            {tab === "addresses" && (
              <div className="space-y-4">
                <h2 className="font-semibold text-neutral-900">Saved Addresses</h2>
                {!profile.addresses || profile.addresses.length === 0 ? (
                  <div className="py-10 text-center">
                    <MapPin className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                    <p className="text-neutral-400 text-sm">No saved addresses yet.</p>
                    <p className="text-xs text-neutral-400 mt-1">Addresses are saved automatically when you place an order.</p>
                  </div>
                ) : (
                  profile.addresses.map((addr) => (
                    <div key={addr._id} className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      addr.isDefault ? "border-[#d98c2a] bg-[#d98c2a]/5" : "border-neutral-200"
                    )}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-neutral-500 uppercase">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-semibold text-[#d98c2a] bg-[#d98c2a]/10 px-2 py-0.5 rounded-full">Default</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-neutral-800">{addr.firstName} {addr.lastName}</p>
                          <p className="text-sm text-neutral-500 mt-0.5">{addr.addressLine1}, {addr.city}, {addr.state}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{addr.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
