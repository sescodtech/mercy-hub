"use client";

import { useState, useEffect } from "react";
import { MapPin, Clock, Briefcase, ChevronDown, ChevronUp, Loader2, Send } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/utils";

interface Job {
  _id: string; title: string; department: string; location: string;
  type: string; description: string; requirements: string; benefits: string; salary: string;
}

interface ApplyForm { name: string; email: string; phone: string; coverLetter: string; cvUrl: string; }

const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-green-100 text-green-700",
  "part-time":  "bg-blue-100 text-blue-700",
  "contract":   "bg-orange-100 text-orange-700",
  "remote":     "bg-purple-100 text-purple-700",
};

export default function CareersPage() {
  const [jobs,     setJobs]     = useState<Job[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ApplyForm>({ name: "", email: "", phone: "", coverLetter: "", cvUrl: "" });

  useEffect(() => {
    (async () => {
      try { const { data } = await axios.get("/api/careers"); setJobs(data.data || []); }
      catch { setJobs([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleApply = async (jobId: string) => {
    if (!form.name || !form.email) { toast.error("Name and email are required"); return; }
    setSubmitting(true);
    try {
      await axios.post(`/api/careers/${jobId}/apply`, form);
      toast.success("Application submitted! We'll be in touch.");
      setApplying(null);
      setForm({ name: "", email: "", phone: "", coverLetter: "", cvUrl: "" });
    } catch (err: any) { toast.error(err?.response?.data?.error ?? "Failed to submit. Try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-[#1a1108] text-white py-20">
        <div className="container-site text-center">
          <p className="text-[#d98c2a] text-xs tracking-[0.3em] uppercase font-body mb-4">Join Our Team</p>
          <h1 className="font-display text-5xl font-light text-white mb-4">Careers at Mercy Home</h1>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm">Be part of a team that brings premium home essentials to Nigerian families.</p>
        </div>
      </div>

      <div className="container-site py-12 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100">
            <Briefcase className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-600 font-medium">No open positions at this time.</p>
            <p className="text-neutral-400 text-sm mt-2">Check back soon or send your CV to our email.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500 mb-6">{jobs.length} open position{jobs.length !== 1 && "s"}</p>
            {jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                <button className="w-full px-6 py-5 flex items-start justify-between gap-4 text-left hover:bg-neutral-50 transition-colors"
                  onClick={() => setExpanded(expanded === job._id ? null : job._id)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="font-semibold text-neutral-900">{job.title}</h3>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide", TYPE_COLORS[job.type] || "bg-neutral-100 text-neutral-600")}>{job.type}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap">
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.department}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      {job.salary && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.salary}</span>}
                    </div>
                  </div>
                  {expanded === job._id ? <ChevronUp className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" /> : <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />}
                </button>

                {expanded === job._id && (
                  <div className="px-6 pb-6 border-t border-neutral-100 pt-5">
                    {job.description && (
                      <div className="mb-5">
                        <h4 className="text-sm font-semibold text-neutral-900 mb-2">About the Role</h4>
                        <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                      </div>
                    )}
                    {job.requirements && (
                      <div className="mb-5">
                        <h4 className="text-sm font-semibold text-neutral-900 mb-2">Requirements</h4>
                        <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
                      </div>
                    )}
                    {job.benefits && (
                      <div className="mb-5">
                        <h4 className="text-sm font-semibold text-neutral-900 mb-2">Benefits</h4>
                        <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">{job.benefits}</p>
                      </div>
                    )}

                    {applying === job._id ? (
                      <div className="mt-6 bg-neutral-50 rounded-xl p-5 border border-neutral-100">
                        <h4 className="font-semibold text-neutral-900 mb-4">Apply for {job.title}</h4>
                        <div className="space-y-3">
                          <div className="grid sm:grid-cols-2 gap-3">
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name *"
                              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
                            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email Address *" type="email"
                              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
                          </div>
                          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone Number"
                            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
                          <input value={form.cvUrl} onChange={(e) => setForm({ ...form, cvUrl: e.target.value })} placeholder="CV / Resume Link (Google Drive, Dropbox, etc.)"
                            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
                          <textarea value={form.coverLetter} onChange={(e) => setForm({ ...form, coverLetter: e.target.value })} placeholder="Cover Letter (optional)"
                            rows={4} className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none" />
                          <div className="flex gap-3">
                            <button onClick={() => handleApply(job._id)} disabled={submitting}
                              className="flex-1 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              {submitting ? "Submitting…" : "Submit Application"}
                            </button>
                            <button onClick={() => setApplying(null)} className="px-4 py-3 border border-neutral-200 text-sm text-neutral-600 rounded-xl hover:bg-neutral-50 transition-colors">Cancel</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setApplying(job._id)}
                        className="mt-4 px-6 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors">
                        Apply for this Position
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
