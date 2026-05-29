import { Metadata } from "next";
import { Suspense } from "react";
import { ShopClient } from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop — All Products",
  description: "Browse our full collection of premium home essentials.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const resolvedSearchParams = await searchParams;
  return (
    <Suspense fallback={<div className="container-site py-10">Loading…</div>}>
      <ShopClient searchParams={resolvedSearchParams} />
    </Suspense>
  );
}
