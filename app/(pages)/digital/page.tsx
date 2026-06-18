import { Metadata } from "next";
import { Suspense } from "react";
import DigitalClient from "./DigitalClient";

export const metadata: Metadata = {
  title: "Digital Services — Data, Airtime, Cable & Exam PINs",
  description: "Buy data bundles, recharge airtime, pay cable TV subscriptions, and get WAEC, NECO & JAMB exam PINs — fast, secure, and all in one place on Mercy Hub.",
};

export default function DigitalPage() {
  return (
    <Suspense fallback={<div className="container-site py-20 text-center text-neutral-400">Loading…</div>}>
      <DigitalClient />
    </Suspense>
  );
}
