import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const folder   = (formData.get("folder") as string) ?? "products";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Only JPEG, PNG, WebP images allowed" }, { status: 400 });
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Image must be under 5MB" }, { status: 400 });
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder:          `mercy-hub/${folder}`,
          resource_type:   "image",
          transformation:  [{ quality: "auto:good", fetch_format: "auto" }],
        },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result as { secure_url: string; public_id: string });
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success:   true,
      url:       result.secure_url,
      publicId:  result.public_id,
    });
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}

// DELETE — remove from Cloudinary
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { publicId } = await req.json();
    if (!publicId) {
      return NextResponse.json({ success: false, error: "publicId required" }, { status: 400 });
    }
    await cloudinary.uploader.destroy(publicId);
    return NextResponse.json({ success: true, message: "Image deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}
