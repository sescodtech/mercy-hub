import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BlogPost from "@/lib/models/Blog";

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "9");
  const query: Record<string, unknown> = { isPublished: true };
  if (category) query.category = category;
  const [posts, total] = await Promise.all([
    BlogPost.find(query).sort({ publishedAt: -1 }).skip((page - 1) * limit).limit(limit).select("-content").lean(),
    BlogPost.countDocuments(query),
  ]);
  return NextResponse.json({ success: true, data: posts, total, pages: Math.ceil(total / limit) });
}
