import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminDashboard } from "./AdminDashboard";

export default async function AdminPage() {
  const session = await auth();
  console.log("[AdminPage] session:", session);
  if (!session?.user) {
    console.log("[AdminPage] No session found, redirecting to /auth/login");
    redirect("/auth/login");
  }
  if (session.user.role !== "admin") {
    console.log(`[AdminPage] User role is ${session.user.role}, not admin. Redirecting to /dashboard`);
    redirect("/dashboard");
  }
  return <AdminDashboard />;
}
