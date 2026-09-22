import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const startedAt = performance.now();
  let database: "ok" | "error" = "error";

  try {
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db?.admin().ping();
      database = "ok";
    }
  } catch (error) {
    console.error("[health] database check failed", error);
  }

  const responseTimeMs = Math.round(performance.now() - startedAt);
  const healthy = database === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "mercy-hub",
      database,
      responseTimeMs,
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version || "unknown",
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
