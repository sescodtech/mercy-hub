"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { cn } from "@/utils";
import Link from "next/link";

const FAQS = [
  {
    category: "Orders",
    items: [
      {
        q: "How do I track my order?",
        a: "Once your order is shipped, you will receive an email and WhatsApp notification with your tracking details. You can also visit your Dashboard → Orders to view real-time order status.",
      },
      {
        q: "Can I modify or cancel my order after placing it?",
        a: "You can request a modification or cancellation within 1 hour of placing your order by contacting us via WhatsApp or email. Once an order is being processed, we cannot guarantee changes.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept card payments, bank transfers, and USSD via Paystack and Flutterwave. We also offer Cash on Delivery (COD) for select locations.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed through Paystack and Flutterwave, which are PCI-DSS compliant payment processors. We never store your card details.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "Lagos: 1–2 business days. Southwest Nigeria: 2–4 days. South-South & Southeast: 3–5 days. Northern Nigeria: 5–7 business days. These are estimates and may vary.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes! Orders above ₦50,000 qualify for free shipping anywhere in Nigeria.",
      },
      {
        q: "Do you ship outside Nigeria?",
        a: "Currently we only ship within Nigeria. International shipping is coming soon.",
      },
      {
        q: "What happens if my item arrives damaged?",
        a: "Please take photos immediately and contact us within 48 hours of delivery via WhatsApp or email. We will arrange a replacement or full refund.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 7 days of delivery for items in their original condition and packaging. Items that have been used or damaged by the customer cannot be returned.",
      },
      {
        q: "How do I initiate a return?",
        a: "Contact us via WhatsApp or email with your order number and reason for return. We will provide a return address and instructions.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds are processed within 3–5 business days of receiving the returned item. The amount will be credited back to your original payment method.",
      },
    ],
  },
  {
    category: "Products",
    items: [
      {
        q: "Are your products original/authentic?",
        a: "Yes. All our products are sourced directly from reputable manufacturers and suppliers. We guarantee the quality and authenticity of everything we sell.",
      },
      {
        q: "Can I request a product that is out of stock?",
        a: "Yes! Contact us via WhatsApp with the product name. We will notify you as soon as it is restocked or help you find a suitable alternative.",
      },
      {
        q: "Do you offer bulk/wholesale pricing?",
        a: "Yes, we offer special pricing for bulk orders. Contact us directly via email or WhatsApp to discuss wholesale arrangements.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItem,  setOpenItem]  = useState<string | null>(null);
  const [search,    setSearch]    = useState("");

  const filtered = FAQS.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <div className="bg-white border-b border-neutral-100 py-16 text-center px-4">
        <h1 className="font-display text-4xl font-semibold text-neutral-900 mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-neutral-500 max-w-md mx-auto mb-8">
          Find answers to common questions about orders, shipping, returns and more.
        </p>
        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-11 pr-4 py-3 text-sm border border-neutral-200 rounded-xl outline-none focus:border-[#d98c2a] bg-white"
          />
        </div>
      </div>

      <div className="container-site py-16 max-w-3xl">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-neutral-400 mb-3">No results for "{search}"</p>
            <button onClick={() => setSearch("")} className="text-sm text-[#d98c2a] hover:underline">
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filtered.map((cat) => (
              <div key={cat.category}>
                <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">{cat.category}</h2>
                <div className="space-y-2">
                  {cat.items.map((item, i) => {
                    const key = `${cat.category}-${i}`;
                    const isOpen = openItem === key;
                    return (
                      <div key={key} className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
                        <button
                          onClick={() => setOpenItem(isOpen ? null : key)}
                          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-neutral-900 pr-4">{item.q}</span>
                          {isOpen
                            ? <ChevronUp className="w-4 h-4 text-[#d98c2a] flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 text-sm text-neutral-600 leading-relaxed border-t border-neutral-50 pt-4">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-white rounded-2xl border border-neutral-100 p-8 text-center">
          <h3 className="font-display text-xl font-semibold text-neutral-900 mb-2">Still have questions?</h3>
          <p className="text-neutral-500 text-sm mb-5">Our team is happy to help. Reach out to us directly.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contact"
              className="px-6 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors">
              Contact Us
            </Link>
            <Link href="/support"
              className="px-6 py-3 border border-neutral-200 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
