import { Metadata } from "next";
import { Suspense } from "react";
import WishlistClient from "./WishlistClient";

export const metadata: Metadata = {
  title: "My Wishlist — Mercy Hub",
  description: "Your saved favorite products.",
};

export default function WishlistPage() {
  return (
    <Suspense fallback={<div className="container-site py-10">Loading Wishlist…</div>}>
      <WishlistClient />
    </Suspense>
  );
}
