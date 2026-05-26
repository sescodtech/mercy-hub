"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Star, Camera, Loader2, Trash2, Edit2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/utils";
import type { IProduct } from "@/types";

interface Review {
  _id: string;
  user: { name: string };
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  isVerified: boolean;
  images: string[];
}

export function ReviewSection({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/reviews?product=${productId}`);
      if (data.success) setReviews(data.data);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = editingId
        ? { reviewId: editingId, rating, title, comment }
        : { productId, rating, title, comment };

      const method = editingId ? "put" : "post";
      const { data } = await axios[method]("/api/reviews", payload);

      if (data.success) {
        toast.success(editingId ? "Review updated!" : "Review submitted!");
        setEditingId(null);
        setTitle(""); setComment(""); setRating(5);
        await fetchReviews();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (r: Review) => {
    setEditingId(r._id);
    setRating(r.rating);
    setTitle(r.title);
    setComment(r.comment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      const { data } = await axios.delete(`/api/reviews?id=${id}`);
      if (data.success) {
        toast.success("Review deleted");
        await fetchReviews();
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-10">
      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <h3 className="font-semibold text-neutral-900 mb-4">
          {editingId ? "Edit Your Review" : "Write a Review"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-neutral-500">Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors",
                    i <= rating ? "bg-brand-500 text-white" : "bg-neutral-100 text-neutral-400"
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Review Title"
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors"
              required
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#d98c2a] transition-colors resize-none"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] disabled:opacity-60 transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? "Update Review" : "Submit Review"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setTitle(""); setComment(""); }}
                className="text-sm text-neutral-400 hover:text-neutral-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <h3 className="font-semibold text-neutral-900">Customer Reviews</h3>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-300" /></div>
        ) : reviews.length === 0 ? (
          <p className="text-neutral-400 text-sm">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r._id} className="bg-white rounded-2xl border border-neutral-100 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-500">
                      {r.user.name[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-neutral-900">{r.user.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((i) => (
                            <Star key={i} className={cn("w-3 h-3", i <= r.rating ? "text-brand-500 fill-brand-500" : "text-neutral-200 fill-neutral-200")} />
                          ))}
                        </div>
                        <span className="text-[10px] text-neutral-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                        {r.isVerified && <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> Verified Purchase</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(r)} className="p-2 text-neutral-400 hover:text-brand-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(r._id)} className="p-2 text-neutral-400 hover:text-red-500 transition- la">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-neutral-900">{r.title}</p>
                  <p className="text-sm text-neutral-600 leading-relaxed">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
