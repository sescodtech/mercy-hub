"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, Save, X, Upload, ImageIcon } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import { cn } from "@/utils";

interface Post { _id: string; title: string; slug: string; category: string; isPublished: boolean; publishedAt: string; viewCount: number; author: string; excerpt: string; content: string; coverImage: string; tags: string[]; }

const EMPTY: Omit<Post, "_id"|"slug"|"viewCount"|"publishedAt"> = {
  title: "", category: "General", isPublished: false, author: "Mercy Home Team",
  excerpt: "", content: "", coverImage: "", tags: [],
};

export default function AdminBlogPage() {
  const [posts,     setPosts]     = useState<Post[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState<Partial<Post> | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    try { const { data } = await axios.get("/api/admin/blog"); setPosts(data.data || []); }
    catch { toast.error("Failed to load posts"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, []);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blog");
      const { data } = await axios.post("/api/upload", formData);
      if (data.success) {
        setEditing((prev) => ({ ...prev, coverImage: data.url }));
        toast.success("Image uploaded!");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!editing?.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      if (editing._id) {
        await axios.put(`/api/admin/blog/${editing._id}`, editing);
        toast.success("Post updated");
      } else {
        await axios.post("/api/admin/blog", editing);
        toast.success("Post created");
      }
      setEditing(null);
      fetchPosts();
    } catch (err: any) { toast.error(err?.response?.data?.error ?? "Save failed"); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try { await axios.delete(`/api/admin/blog/${id}`); toast.success("Post deleted"); fetchPosts(); }
    catch { toast.error("Delete failed"); }
  };

  const togglePublish = async (post: Post) => {
    try {
      await axios.put(`/api/admin/blog/${post._id}`, { ...post, isPublished: !post.isPublished, publishedAt: !post.isPublished ? new Date() : post.publishedAt });
      toast.success(post.isPublished ? "Post unpublished" : "Post published");
      fetchPosts();
    } catch { toast.error("Failed to update"); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" /></div>;

  if (editing !== null) return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{editing._id ? "Edit Post" : "New Post"}</h1>
        <button onClick={() => setEditing(null)} className="text-neutral-400 hover:text-neutral-700"><X className="w-5 h-5" /></button>
      </div>
      <div className="space-y-4 bg-white rounded-2xl border p-6">

        {/* Simple fields */}
        {[["Title", "title", "Post title"], ["Category", "category", "General"], ["Author", "author", "Mercy Home Team"]].map(([label, key, ph]) => (
          <div key={key}>
            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">{label}</label>
            <input value={(editing as any)[key] || ""} onChange={(e) => setEditing({ ...editing, [key]: e.target.value })} placeholder={ph}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
          </div>
        ))}

        {/* Cover Image with Upload */}
        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Cover Image</label>

          {/* Image preview */}
          {editing.coverImage && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-neutral-200 mb-3 bg-neutral-50">
              <Image src={editing.coverImage} alt="Cover preview" fill className="object-cover" unoptimized />
              <button onClick={() => setEditing({ ...editing, coverImage: "" })}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow text-neutral-500 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload button + URL input */}
          <div className="flex gap-2">
            <input
              value={editing.coverImage || ""}
              onChange={(e) => setEditing({ ...editing, coverImage: e.target.value })}
              placeholder="Paste image URL or upload below"
              className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
          />
          <p className="text-xs text-neutral-400 mt-1.5 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Upload from your device or paste a URL. Max 5MB. JPG, PNG, WebP.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Excerpt</label>
          <textarea value={editing.excerpt || ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={3}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none" placeholder="Short summary…" />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Content</label>
          <textarea value={editing.content || ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={12}
            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] resize-none font-mono" placeholder="Post content (HTML supported)…" />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Tags (comma-separated)</label>
          <input value={(editing.tags || []).join(", ")} onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
            placeholder="home decor, tips, Nigeria" className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a]" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className={cn("w-10 h-5 rounded-full transition-colors relative", editing.isPublished ? "bg-[#d98c2a]" : "bg-neutral-300")}
            onClick={() => setEditing({ ...editing, isPublished: !editing.isPublished })}>
            <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", editing.isPublished ? "translate-x-5" : "translate-x-0.5")} />
          </div>
          <span className="text-sm font-medium text-neutral-700">{editing.isPublished ? "Published" : "Draft"}</span>
        </label>
        <div className="flex gap-3 pt-2">
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Post"}
          </button>
          <button onClick={() => setEditing(null)} className="px-6 py-3 border border-neutral-200 text-sm text-neutral-600 rounded-xl hover:bg-neutral-50">Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold">Blog Posts</h1><p className="text-sm text-neutral-400">{posts.length} posts</p></div>
        <button onClick={() => setEditing({ ...EMPTY })} className="flex items-center gap-2 px-4 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>
      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <p className="text-neutral-400 text-sm">No posts yet. Create your first post!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>{["Title", "Category", "Status", "Views", "Date", ""].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {posts.map((post) => (
                <tr key={post._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900 truncate max-w-xs">{post.title}</p>
                    <p className="text-xs text-neutral-400">{post.author}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{post.category}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 rounded-full text-[10px] font-semibold uppercase", post.isPublished ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500")}>
                      {post.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500">{post.viewCount}</td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => togglePublish(post)} className="p-1.5 text-neutral-400 hover:text-[#d98c2a] transition-colors" title={post.isPublished ? "Unpublish" : "Publish"}>
                        {post.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditing(post)} className="p-1.5 text-neutral-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => remove(post._id)} className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
