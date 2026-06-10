import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import BlogPost from "@/lib/models/Blog";

function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  await connectDB();
  const posts = await BlogPost.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, data: posts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  await connectDB();
  const body = await req.json();
  if (!body.title) return NextResponse.json({ success: false, error: "Title required" }, { status: 400 });
  const base = slugify(body.title);
  let slug = base;
  if (await BlogPost.findOne({ slug })) slug = `${base}-${Date.now()}`;
  if (body.isPublished && !body.publishedAt) body.publishedAt = new Date();
  const post = await BlogPost.create({ ...body, slug });
  return NextResponse.json({ success: true, data: post }, { status: 201 });
}
