"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, MessageCircle, Clock, Send, Loader2, CheckCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSettings } from "@/hooks/useSettings";

export default function ContactPage() {
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSending(true);
    try {
      await axios.post("/api/contact", form);
      setSent(true);
      toast.success("Message sent! We'll get back to you soon.");
    } catch {
      toast.error("Failed to send message. Please try again or WhatsApp us.");
    } finally {
      setSending(false);
    }
  };

  const whatsappUrl = settings?.whatsapp
    ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=Hello, I need help with my order`
    : null;

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-white border-b border-neutral-100 py-16 text-center">
        <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-3">Get in Touch</h1>
        <p className="text-neutral-500 max-w-md mx-auto">
          Have a question about your order or our products? We're here to help.
        </p>
      </div>

      <div className="container-site py-16">
        <div className="grid lg:grid-cols-[1fr_480px] gap-16">

          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-6">Contact Information</h2>
              <div className="space-y-5">
                {settings?.address?.street && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#d98c2a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#d98c2a]" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 mb-0.5">Address</p>
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        {settings.address.street}<br />
                        {settings.address.city}, {settings.address.state}<br />
                        {settings.address.country}
                      </p>
                    </div>
                  </div>
                )}

                {settings?.phone && settings.phone.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#d98c2a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-[#d98c2a]" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 mb-0.5">Phone</p>
                      {settings.phone.map((p, i) => (
                        <a key={i} href={`tel:${p}`} className="block text-sm text-neutral-500 hover:text-[#d98c2a] transition-colors">
                          {p}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {settings?.email && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#d98c2a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-[#d98c2a]" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 mb-0.5">Email</p>
                      <a href={`mailto:${settings.email}`} className="text-sm text-neutral-500 hover:text-[#d98c2a] transition-colors">
                        {settings.email}
                      </a>
                      {settings.supportEmail && settings.supportEmail !== settings.email && (
                        <a href={`mailto:${settings.supportEmail}`} className="block text-sm text-neutral-500 hover:text-[#d98c2a] transition-colors">
                          {settings.supportEmail} (Support)
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {whatsappUrl && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 mb-0.5">WhatsApp</p>
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:text-green-700 font-medium">
                        Chat with us on WhatsApp →
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#d98c2a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#d98c2a]" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 mb-0.5">Business Hours</p>
                    <p className="text-sm text-neutral-500">Monday – Friday: 9am – 6pm</p>
                    <p className="text-sm text-neutral-500">Saturday: 10am – 4pm</p>
                    <p className="text-sm text-neutral-500">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white rounded-2xl border border-neutral-100 p-8">
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-neutral-900 mb-2">Message Sent!</h3>
                <p className="text-neutral-500 text-sm mb-6">We'll get back to you within 24 hours.</p>
                <button onClick={() => { setSent(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
                  className="text-sm text-[#d98c2a] hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h2 className="font-display text-xl font-semibold text-neutral-900 mb-5">Send a Message</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { key: "name",    label: "Full Name *",  placeholder: "Adaeze Okafor",    type: "text" },
                    { key: "email",   label: "Email *",       placeholder: "you@example.com",  type: "email" },
                    { key: "phone",   label: "Phone",         placeholder: "+234 801 234 5678", type: "tel" },
                    { key: "subject", label: "Subject",       placeholder: "Order enquiry",    type: "text" },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">{label}</label>
                      <input type={type} value={(form as Record<string, string>)[key]}
                        onChange={(e) => set(key, e.target.value)} placeholder={placeholder}
                        className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors" />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Message *</label>
                  <textarea value={form.message} onChange={(e) => set("message", e.target.value)}
                    rows={5} placeholder="How can we help you?"
                    className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors resize-none" />
                </div>
                <button type="submit" disabled={sending}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
