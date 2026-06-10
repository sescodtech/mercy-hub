import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlogPost extends Document {
  title: string; slug: string; excerpt: string; content: string; coverImage: string;
  category: string; tags: string[]; author: string; isPublished: boolean;
  publishedAt: Date | null; seo: { title: string; description: string; keywords: string[] };
  viewCount: number; createdAt: Date; updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>({
  title:       { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  excerpt:     { type: String, default: "" },
  content:     { type: String, default: "" },
  coverImage:  { type: String, default: "" },
  category:    { type: String, default: "General" },
  tags:        { type: [String], default: [] },
  author:      { type: String, default: "Mercy Home Team" },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date, default: null },
  seo: { title: { type: String, default: "" }, description: { type: String, default: "" }, keywords: { type: [String], default: [] } },
  viewCount:   { type: Number, default: 0 },
}, { timestamps: true });

BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ isPublished: 1, publishedAt: -1 });

const BlogPost: Model<IBlogPost> = mongoose.models.BlogPost || mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);
export default BlogPost;
