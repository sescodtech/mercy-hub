"use client";

import { Lightbulb, Gamepad2, Gem, Tv2 } from "lucide-react";

const UPCOMING = [
  { label: "Electricity Bills",   icon: Lightbulb, desc: "Pay your prepaid/postpaid bills" },
  { label: "Betting Wallet Funding", icon: Gamepad2, desc: "Fund Bet9ja, SportyBet & more" },
  { label: "Insurance & Levies",  icon: Gem,        desc: "Vehicle & TV licence renewals" },
  { label: "Streaming Subscriptions", icon: Tv2,    desc: "Netflix, Showmax & more" },
];

export function OtherTab() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <h2 className="font-semibold text-neutral-900 mb-1">Other Digital Services</h2>
      <p className="text-sm text-neutral-500 mb-5">More services are on the way — here's what's coming next.</p>
      <div className="grid grid-cols-2 gap-3">
        {UPCOMING.map((u) => {
          const Icon = u.icon;
          return (
            <div key={u.label} className="rounded-xl border border-dashed border-neutral-200 p-4 relative">
              <span className="absolute top-2.5 right-2.5 text-[9px] font-bold uppercase tracking-wide text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full">
                Coming Soon
              </span>
              <Icon className="w-5 h-5 mb-2 text-neutral-400" />
              <p className="text-sm font-semibold text-neutral-700">{u.label}</p>
              <p className="text-xs text-neutral-400 mt-0.5 leading-snug">{u.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
