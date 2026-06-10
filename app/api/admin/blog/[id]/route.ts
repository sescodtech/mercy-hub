import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import BlogPost from "@/lib/models/Blog";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ success: false }, { status: 403 });
  await connectDB();
  const { id } = await params;
  const post = await BlogPost.findById(id);
  if (!post) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: post });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ success: false }, { status: 403 });
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  delete body._id; delete body.__v;
  if (body.isPublished && !body.publishedAt) body.publishedAt = new Date();
  const post = await BlogPost.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  if (!post) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: post });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ success: false }, { status: 403 });
  await connectDB();
  const { id } = await params;
  await BlogPost.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
