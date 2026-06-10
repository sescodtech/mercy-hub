"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Users, Loader2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/utils";

interface Application { _id: string; name: string; email: string; phone: string; coverLetter: string; cvUrl: string; status: string; appliedAt: string; notes: string; }
interface Job { _id: string; title: string; department: string; location: string; type: string; description: string; requirements: string; benefits: string; salary: string; isActive: boolean; applications: Application[]; }

const EMPTY_JOB: Omit<Job, "_id"|"applications"> = {
  title: "", department: "General", location: "Lagos, Nigeria", type: "full-time",
  description: "", requirements: "", benefits: "", salary: "", isActive: true,
};

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700", reviewing: "bg-yellow-100 text-yellow-700",
  interview: "bg-purple-100 text-purple-700", rejected: "bg-red-100 text-red-600",
  hired: "bg-green-100 text-green-700",
};

export default function AdminCareersPage() {
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Job> | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchJobs = async () => {
    try { const { data } = await axios.get("/api/admin/careers"); setJobs(data.data || []); }
    catch { toast.error("Failed to load jobs"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, []);

  const save = async () => {
    if (!editing?.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      if (editing._id) { await axios.put(`/api/admin/careers/${editing._id}`, editing); toast.success("Job updated"); }
      else { await axios.post("/api/admin/careers", editing); toast.success("Job created"); }
      setEditing(null);
      fetchJobs();
    } catch (err: any) { toast.error(err?.response?.data?.error ?? "Save failed"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this job posting?")) return;
    try { await axios.delete(`/api/admin/careers/${id}`); toast.success("Job deleted"); fetchJobs(); }
    catch { toast.error("Delete failed"); }
  };

  const updateAppStatus = async (jobId: string, appId: string, status: string) => {
    try {
      await axios.patch(`/api/admin/careers/${jobId}/applications/${appId}`, { status });
      toast.success("Status updated");
      fetchJobs();
    } catch { toast.error("Failed to update"); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" /></div>;

  if (editing !== null) return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{editing._id ? "Edit Job" : "New Job Posting"}</h1>
        <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-neutral-400" /></button>
      </div>
      <div className="space-y-4 bg-white rounded-2xl border p-6">
        {[["Job Title", "title"], ["Department", "department"], ["Location", "location"], ["Salary/Range", "salary"]].map(([label, key]) => (
          <div key={key}>
            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">{label}</label>
            <input value={(editing as any)[key] || ""} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
          </div>
        ))}
        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Type</label>
          <select value={editing.type || "full-time"} onChange={(e) => setEditing({ ...editing, type: e.target.value })}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]">
            {["full-time","part-time","contract","remote"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {[["Description", "description"], ["Requirements", "requirements"], ["Benefits", "benefits"]].map(([label, key]) => (
          <div key={key}>
            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">{label}</label>
            <textarea value={(editing as any)[key] || ""} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })} rows={5}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none" />
          </div>
        ))}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={cn("w-10 h-5 rounded-full relative transition-colors", editing.isActive ? "bg-[#d98c2a]" : "bg-neutral-300")}
            onClick={() => setEditing({ ...editing, isActive: !editing.isActive })}>
            <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", editing.isActive ? "translate-x-5" : "translate-x-0.5")} />
          </div>
          <span className="text-sm font-medium">{editing.isActive ? "Active (visible to applicants)" : "Inactive (hidden)"}</span>
        </label>
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Job"}
          </button>
          <button onClick={() => setEditing(null)} className="px-6 py-3 border border-neutral-200 text-sm rounded-xl hover:bg-neutral-50">Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold">Career Postings</h1><p className="text-sm text-neutral-400">{jobs.length} jobs</p></div>
        <button onClick={() => setEditing({ ...EMPTY_JOB })} className="flex items-center gap-2 px-4 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020]">
          <Plus className="w-4 h-4" /> New Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border"><p className="text-neutral-400 text-sm">No job postings yet.</p></div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job._id} className="bg-white rounded-2xl border overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-neutral-900">{job.title}</span>
                    <span className={cn("px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full", job.isActive ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500")}>{job.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <p className="text-xs text-neutral-400">{job.department} · {job.location} · {job.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpanded(expanded === job._id ? null : job._id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-600">
                    <Users className="w-3.5 h-3.5" />{job.applications.length}
                    {expanded === job._id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button onClick={() => setEditing(job)} className="p-2 text-neutral-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => remove(job._id)} className="p-2 text-neutral-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {expanded === job._id && job.applications.length > 0 && (
                <div className="border-t border-neutral-100 px-5 py-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Applications ({job.applications.length})</p>
                  <div className="space-y-2">
                    {job.applications.map((app) => (
                      <div key={app._id} className="flex items-center justify-between bg-neutral-50 rounded-xl px-4 py-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{app.name}</p>
                          <p className="text-xs text-neutral-400">{app.email} · {new Date(app.appliedAt).toLocaleDateString()}</p>
                          {app.cvUrl && <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#d98c2a] underline">View CV</a>}
                        </div>
                        <select value={app.status} onChange={(e) => updateAppStatus(job._id, app._id, e.target.value)}
                          className={cn("text-xs font-semibold px-2 py-1 rounded-full border-0 outline-none cursor-pointer", STATUS_COLORS[app.status] || "bg-neutral-100 text-neutral-600")}>
                          {["applied","reviewing","interview","rejected","hired"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {expanded === job._id && job.applications.length === 0 && (
                <div className="border-t border-neutral-100 px-5 py-4 text-center text-sm text-neutral-400">No applications yet.</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
