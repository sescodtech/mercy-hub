"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Calendar, Eye, Tag, ChevronRight, Loader2 } from "lucide-react";
import axios from "axios";
import { cn } from "@/utils";

interface BlogPost {
  _id: string; title: string; slug: string; excerpt: string; coverImage: string;
  category: string; tags: string[]; author: string; publishedAt: string; viewCount: number;
}

const CATEGORIES = ["All", "Home Decor", "Lifestyle", "Tips & Tricks", "Product Spotlight", "General"];

export default function BlogPage() {
  const [posts,    setPosts]    = useState<BlogPost[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("All");
  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 9 };
      if (category !== "All") params.category = category;
      const { data } = await axios.get("/api/blog", { params });
      setPosts(data.data || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPosts(); }, [category, page]);

  const filtered = search
    ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase()))
    : posts;

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-[#1a1108] text-white py-20">
        <div className="container-site text-center">
          <p className="text-[#d98c2a] text-xs tracking-[0.3em] uppercase font-body mb-4">Our Journal</p>
          <h1 className="font-display text-5xl font-light text-white mb-4">Home Living Blog</h1>
          <p className="text-neutral-400 max-w-xl mx-auto text-sm">Tips, inspiration, and stories for your home.</p>
        </div>
      </div>

      <div className="container-site py-12">
        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts…"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-neutral-200 rounded-xl bg-white outline-none focus:border-[#d98c2a]" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
                className={cn("px-4 py-2 rounded-xl text-xs font-medium transition-colors",
                  category === cat ? "bg-[#d98c2a] text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-[#d98c2a]")}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-sm">No posts found.</p>
            {search && <button onClick={() => setSearch("")} className="mt-3 text-[#d98c2a] text-sm underline">Clear search</button>}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((post) => (
                <Link key={post._id} href={`/blog/${post.slug}`} className="group bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-neutral-100">
                    {post.coverImage ? (
                      <Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center"><Tag className="w-10 h-10 text-neutral-300" /></div>
                    )}
                    <span className="absolute top-3 left-3 px-2 py-1 bg-[#d98c2a] text-white text-[10px] font-semibold rounded-md uppercase tracking-wide">{post.category}</span>
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-[#d98c2a] transition-colors">{post.title}</h2>
                    <p className="text-sm text-neutral-500 line-clamp-3 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[#d98c2a] font-medium">Read <ChevronRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)}
                    className={cn("w-10 h-10 rounded-xl text-sm font-medium transition-colors",
                      p === page ? "bg-[#d98c2a] text-white" : "bg-white border border-neutral-200 text-neutral-600 hover:border-[#d98c2a]")}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
