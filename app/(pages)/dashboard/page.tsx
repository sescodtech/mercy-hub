import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  console.log("[DashboardPage] session:", session);

  if (!session?.user) {
    console.log("[DashboardPage] No session found, redirecting to login");
    redirect("/auth/login");
  }

  if (session.user.role === "admin") {
    console.log("[DashboardPage] Admin user, redirecting to /admin");
    redirect("/admin");
  }

  console.log("[DashboardPage] User user, redirecting to /dashboard/profile");
  redirect("/dashboard/profile");
}
