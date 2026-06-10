import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BlogPost from "@/lib/models/Blog";

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  await connectDB();
  const { slug } = await params;
  const post = await BlogPost.findOneAndUpdate({ slug, isPublished: true }, { $inc: { viewCount: 1 } }, { new: true });
  if (!post) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: post });
}
