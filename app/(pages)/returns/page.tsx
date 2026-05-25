import Link from "next/link";
import { RotateCcw, CheckCircle, XCircle, Clock } from "lucide-react";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-white border-b border-neutral-100 py-12 text-center">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Return Policy</h1>
        <p className="text-neutral-500 mt-2">Easy returns within 7 days of delivery</p>
      </div>
      <div className="container-site py-16 max-w-4xl space-y-8">

        {/* Quick summary */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock,        color: "text-blue-600",  bg: "bg-blue-50",  title: "7 Days",        sub: "Return window from delivery date" },
            { icon: CheckCircle,  color: "text-green-600", bg: "bg-green-50", title: "Free Returns",   sub: "For damaged or wrong items" },
            { icon: RotateCcw,    color: "text-[#d98c2a]", bg: "bg-[#d98c2a]/10", title: "3–5 Days", sub: "Refund processing time" },
          ].map(({ icon: Icon, color, bg, title, sub }) => (
            <div key={title} className="bg-white rounded-2xl border border-neutral-100 p-6 text-center">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <p className="font-semibold text-neutral-900">{title}</p>
              <p className="text-xs text-neutral-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-8 space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="font-semibold text-neutral-900 text-base mb-3">What can be returned?</h2>
            <div className="space-y-2">
              {[
                { ok: true,  text: "Items in original, unused condition with packaging intact" },
                { ok: true,  text: "Items received damaged or defective" },
                { ok: true,  text: "Wrong item delivered" },
                { ok: false, text: "Used or worn items" },
                { ok: false, text: "Items without original packaging" },
                { ok: false, text: "Items purchased on flash sale (unless defective)" },
              ].map(({ ok, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  {ok
                    ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                  <span className={ok ? "text-neutral-700" : "text-neutral-400"}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-6">
            <h2 className="font-semibold text-neutral-900 text-base mb-3">How to Return</h2>
            <ol className="space-y-3 text-neutral-600">
              <li className="flex gap-3"><span className="w-6 h-6 bg-[#d98c2a] text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">1</span>Contact us within 7 days of delivery via WhatsApp or email with your order number and reason.</li>
              <li className="flex gap-3"><span className="w-6 h-6 bg-[#d98c2a] text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">2</span>Take clear photos of the item and packaging and send them to us.</li>
              <li className="flex gap-3"><span className="w-6 h-6 bg-[#d98c2a] text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">3</span>We will review and approve your return within 24 hours and provide return address.</li>
              <li className="flex gap-3"><span className="w-6 h-6 bg-[#d98c2a] text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 font-bold">4</span>Ship the item back. Once received and inspected, your refund will be processed in 3–5 business days.</li>
            </ol>
          </div>

          <div className="border-t border-neutral-100 pt-6 text-center">
            <p className="text-neutral-500 mb-4">Have questions about a return?</p>
            <Link href="/contact" className="px-6 py-3 bg-[#d98c2a] text-white text-sm font-medium rounded-xl hover:bg-[#c47020] transition-colors inline-block">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
