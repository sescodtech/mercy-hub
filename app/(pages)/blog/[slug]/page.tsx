"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Eye, Tag, ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";

interface BlogPost {
  _id: string; title: string; slug: string; excerpt: string; content: string;
  coverImage: string; category: string; tags: string[]; author: string;
  publishedAt: string; viewCount: number;
}

export default function BlogPostPage() {
  const { slug }   = useParams<{ slug: string }>();
  const router     = useRouter();
  const [post,     setPost]    = useState<BlogPost | null>(null);
  const [loading,  setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/api/blog/${slug}`);
        if (data.success) setPost(data.data);
        else setNotFound(true);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cream"><Loader2 className="w-8 h-8 animate-spin text-[#d98c2a]" /></div>;
  if (notFound || !post) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream gap-4">
      <p className="text-neutral-600">Post not found.</p>
      <Link href="/blog" className="text-[#d98c2a] text-sm underline">Back to Blog</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      {post.coverImage && (
        <div className="relative h-72 md:h-96 bg-neutral-200">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container-site pb-8">
            <span className="inline-block px-3 py-1 bg-[#d98c2a] text-white text-xs font-semibold rounded-md uppercase tracking-wide mb-3">{post.category}</span>
            <h1 className="font-display text-3xl md:text-5xl font-light text-white leading-tight">{post.title}</h1>
          </div>
        </div>
      )}

      <div className="container-site py-10 max-w-3xl mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-[#d98c2a] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {!post.coverImage && (
          <>
            <span className="inline-block px-3 py-1 bg-[#d98c2a] text-white text-xs font-semibold rounded-md uppercase tracking-wide mb-4">{post.category}</span>
            <h1 className="font-display text-4xl font-light text-neutral-900 mb-4">{post.title}</h1>
          </>
        )}

        <div className="flex items-center gap-4 text-xs text-neutral-400 mb-8 flex-wrap">
          <span className="font-medium text-neutral-600">By {post.author}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.publishedAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount} views</span>
        </div>

        {post.excerpt && <p className="text-lg text-neutral-600 leading-relaxed border-l-4 border-[#d98c2a] pl-5 mb-8 italic">{post.excerpt}</p>}

        <div className="prose prose-neutral prose-headings:font-display prose-headings:font-light prose-a:text-[#d98c2a] max-w-none" dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }} />

        {post.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-10 pt-8 border-t border-neutral-100">
            <Tag className="w-4 h-4 text-neutral-400" />
            {post.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-10">
          <Link href="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors">
            <ArrowLeft className="w-4 h-4" /> More Posts
          </Link>
        </div>
      </div>
    </div>
  );
}
