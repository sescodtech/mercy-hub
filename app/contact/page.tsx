"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const INFO = [
  { Icon: MapPin,  label: "Address",    value: "123 Luxury Lane, Victoria Island, Lagos, Nigeria" },
  { Icon: Phone,   label: "Phone",      value: "+234 800 000 0000" },
  { Icon: Mail,    label: "Email",      value: "hello@mercyhomeessentials.com" },
  { Icon: Clock,   label: "Hours",      value: "Mon–Fri: 9am–6pm · Sat: 10am–4pm" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200)); // simulate API
    toast.success("Message sent! We'll be in touch within 24 hours.");
    setForm({ name: "", email: "", subject: "", message: "" });
    setLoading(false);
  };

  return (
    <div className="bg-cream min-h-screen">
      {/* Hero */}
      <div className="bg-ebony text-cream py-16">
        <div className="container-site text-center">
          <span className="section-tag text-brand-400">Get in Touch</span>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white mt-2">
            We&apos;d Love to Hear From You
          </h1>
          <p className="text-cream/60 mt-4 max-w-xl mx-auto">
            Have a question, complaint, or compliment? Reach out — our team responds within 24 hours.
          </p>
        </div>
      </div>

      <div className="container-site py-16">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* Info */}
          <div className="space-y-6">
            {INFO.map(({ Icon, label, value }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-0.5">{label}</p>
                  <p className="text-sm text-neutral-700">{value}</p>
                </div>
              </motion.div>
            ))}

            {/* Map placeholder */}
            <div className="rounded-xl overflow-hidden h-48 bg-neutral-200 mt-4">
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-sm text-neutral-400">Map coming soon</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-luxury p-8"
          >
            <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    className="input-field"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="input-field"
                  placeholder="What is this about?"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  required
                  rows={6}
                  className="input-field resize-none"
                  placeholder="Tell us how we can help…"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-4">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
