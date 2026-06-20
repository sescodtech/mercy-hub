import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're Offline | Mercy Home Essentials",
};

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
