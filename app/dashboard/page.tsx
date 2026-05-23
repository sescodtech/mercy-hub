import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "My Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");
  return <DashboardClient user={session.user} />;
}
