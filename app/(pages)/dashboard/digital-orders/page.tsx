"use client";

/**
 * app/(pages)/dashboard/digital-orders/page.tsx
 * Customer's digital purchase history
 */

import { useState, useEffect } from "react";
import { Wifi, Phone, Tv, BookOpen, Loader2, ChevronLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface DigitalOrder {
  _id: string; orderRef: string; category: string; planName: string;
  phone?: string; smartcard?: string; examName?: string;
  amount: number; status: string; createdAt: string;
  paymentMethod: string; pins?: string[];
}

const ICONS: Record<string, typeof Wifi> = { data: Wifi, airtime: Phone, cable: Tv, education: BookOpen };
const STATUS_ICONS = {
  fulfilled:  { icon: CheckCircle, cls: "text-green-500" },
  failed:     { icon: XCircle,     cls: "text-red-400"   },
  pending:    { icon: Clock,       cls: "text-yellow-500" },
  processing: { icon: Loader2,     cls: "text-blue-500"  },
};
const STATUS_BADGE: Record<string, string> = {
  fulfilled: "bg-green-50 text-green-700 border-green-200",
  failed:    "bg-red-50 text-red-700 border-red-200",
  pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing:"bg-blue-50 text-blue-700 border-blue-200",
  refunded:  "bg-gray-50 text-gray-700 border-gray-200",
};

function fmt(n: number) { return `₦${(n || 0).toLocaleString("en-NG")}`; }
function dateStr(d: string) {
  return new Date(d).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function DigitalOrdersPage() {
  const [orders,  setOrders]  = useState<DigitalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [catF,    setCatF]    = useState("");
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const [expanded,setExpanded]= useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: "10" });
    if (catF) q.set("category", catF);

    fetch(`/api/digital/transactions?${q}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setOrders(d.data); setTotal(d.pagination.total); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, catF]);

  return (
    <div className="min-h-screen bg-[#fdf8f0]">

      <div className="bg-white border-b border-neutral-100">
        <div className="container-site py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-semibold text-neutral-900">Digital Orders</h1>
            <p className="text-xs text-neutral-400">Your data, airtime and service purchases</p>
          </div>
        </div>
      </div>

      <div className="container-site py-6 max-w-2xl mx-auto">

        {/* Category filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {["", "data", "airtime", "cable", "education"].map(c => (
            <button key={c}
              onClick={() => { setCatF(c); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize ${
                catF === c
                  ? "border-[#d98c2a] bg-[#d98c2a]/10 text-[#d98c2a]"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-300"
              }`}>
              {c || "All"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#d98c2a]" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
            <Wifi className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
            <p className="text-neutral-500 text-sm">No digital orders yet</p>
            <Link href="/digital" className="mt-3 inline-block text-sm text-[#d98c2a] hover:underline">Buy data or airtime →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => {
              const Icon     = ICONS[o.category] || Wifi;
              const statusObj= STATUS_ICONS[o.status as keyof typeof STATUS_ICONS];
              const StatusIcon = statusObj?.icon || Clock;
              const isExpanded = expanded === o._id;

              return (
                <div key={o._id} className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                  <button className="w-full p-4 text-left"
                    onClick={() => setExpanded(isExpanded ? null : o._id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#d98c2a]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#d98c2a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 text-sm truncate">{o.planName}</p>
                        <p className="text-xs text-neutral-400">{dateStr(o.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-neutral-900 text-sm">{fmt(o.amount)}</p>
                        <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[o.status] || ""}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-neutral-50 px-4 py-4 bg-neutral-50/50 space-y-2 text-sm">
                      <div className="flex justify-between text-neutral-600">
                        <span>Order Ref</span>
                        <span className="font-mono text-xs text-neutral-500">{o.orderRef}</span>
                      </div>
                      {o.phone && (
                        <div className="flex justify-between text-neutral-600">
                          <span>Phone</span><span>{o.phone}</span>
                        </div>
                      )}
                      {o.smartcard && (
                        <div className="flex justify-between text-neutral-600">
                          <span>Smartcard</span><span>{o.smartcard}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-neutral-600">
                        <span>Payment</span>
                        <span className="capitalize">{o.paymentMethod}</span>
                      </div>

                      {o.pins && o.pins.length > 0 && (
                        <div className="mt-3 bg-[#fdf8f0] border border-[#d98c2a]/20 rounded-xl p-3">
                          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Your Exam Pins</p>
                          {o.pins.map((pin, i) => (
                            <p key={i} className="font-mono text-base font-bold text-[#d98c2a] text-center">{pin}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="flex justify-between items-center mt-5 text-sm text-neutral-500">
            <span>{total} orders total</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-white">
                Previous
              </button>
              <button disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 disabled:opacity-40 hover:bg-white">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
