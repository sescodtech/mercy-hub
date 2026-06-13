import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── 1. Auth cookie detection ────────────────────────────────
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // Decode role from JWT without full NextAuth — fast edge-compatible check
  let role: string | null = null;
  if (sessionToken) {
    try {
      // Auth.js v5 JWT is base64url — decode the payload (index 1)
      const parts = sessionToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64url").toString("utf8")
        );
        role = payload?.role ?? null;
      }
    } catch {
      // malformed token — treat as unauthenticated
    }
  }

  const isAdmin = role === "admin";

  // ── 2. Admin route guard ────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
    // Logged-in but not admin → back to home
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // ── 3. Admin API guard ──────────────────────────────────────
  // Belt-and-suspenders: middleware + individual route checks
  if (pathname.startsWith("/api/admin")) {
    if (!isLoggedIn || !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // ── 4. Protected customer routes ────────────────────────────
  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/dashboard")
  ) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/checkout/:path*",
    "/dashboard/:path*",
  ],
};
