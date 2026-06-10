"use client";

import { motion } from "framer-motion";
import { ShieldCheck, RefreshCw, Truck, CreditCard } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export function TrustBadges() {
  const { settings } = useSettings();
  const shippingThreshold = settings?.shipping?.freeShippingThreshold ?? 50000;
  const shippingEnabled   = settings?.shipping?.enabled !== false;
  const freeEnabled       = settings?.shipping?.freeShippingEnabled !== false;
  const freeDeliveryDesc  = !shippingEnabled
    ? "Free delivery on all orders"
    : freeEnabled
    ? `On orders above ₦${shippingThreshold.toLocaleString()}`
    : "Shipping calculated at checkout";

  const badges = [
    { Icon: Truck,       title: "Free Delivery",    desc: freeDeliveryDesc },
    { Icon: RefreshCw,   title: "Easy Returns",     desc: "30-day return policy" },
    { Icon: ShieldCheck, title: "Secure Payment",   desc: "100% protected checkout" },
    { Icon: CreditCard,  title: "Flexible Payment", desc: "Paystack · Card · Transfer" },
  ];

  return (
    <section className="border-y border-neutral-100 bg-white">
      <div className="container-site py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 py-2"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{title}</p>
                <p className="text-xs text-neutral-400">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
