"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Zap } from "lucide-react";
import { fmt, dateStr } from "../utils";

interface Provider {
  name: string; connected: boolean; balance: number | null;
  error: string | null; latencyMs: number; checkedAt: string;
}
interface ErrorRow {
  _id: string; orderRef: string; category: string; planName: string;
  failReason?: string; retryCount: number; createdAt: string;
}

export function DiagnosticsTab() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [errors,    setErrors]  = useState<ErrorRow[]>([]);
  const [loading,   setLoading] = useState(true);

  useEffect(() => { runCheck(); }, []);

  async function runCheck() {
    setLoading(true);
    const r = await fetch("/api/admin/digital/diagnostics");
    const d = await r.json();
    if (d.success) { setProvider(d.provider); setErrors(d.recentErrors); }
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={runCheck} disabled={loading}
          className="flex items-center gap-2 text-sm text-neutral-500 border border-neutral-200 px-3 py-2 rounded-lg hover:bg-neutral-50 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Run Diagnostics
        </button>
      </div>

      {/* Provider status card */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6">
        <h2 className="font-semibold text-neutral-900 mb-4">Provider Health</h2>
        {loading && !provider ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-[#d98c2a]" /></div>
        ) : provider ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-neutral-100 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Provider</p>
              <p className="font-semibold text-neutral-900 flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> {provider.name}</p>
            </div>
            <div className="border border-neutral-100 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Status</p>
              {provider.connected ? (
                <p className="font-semibold text-green-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Connected</p>
              ) : (
                <p className="font-semibold text-red-500 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Unreachable</p>
              )}
            </div>
            <div className="border border-neutral-100 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Balance</p>
              <p className="font-semibold text-neutral-900">{provider.balance != null ? fmt(provider.balance) : "—"}</p>
            </div>
            <div className="border border-neutral-100 rounded-xl p-4">
              <p className="text-xs text-neutral-400 uppercase tracking-wide mb-1">Response Time</p>
              <p className="font-semibold text-neutral-900">{provider.latencyMs}ms</p>
            </div>
            {provider.error && (
              <div className="sm:col-span-2 lg:col-span-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {provider.error}
              </div>
            )}
            <p className="sm:col-span-2 lg:col-span-4 text-xs text-neutral-400">Last checked {dateStr(provider.checkedAt)}</p>
          </div>
        ) : null}
      </div>

      {/* Error tracking */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">Recent Errors</h2>
          <p className="text-sm text-neutral-400">The last 20 failed deliveries and why they failed.</p>
        </div>
        {errors.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-10">No recent failures — all clear.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase">Order</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase">Plan</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase">Reason</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase">Retries</th>
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-neutral-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {errors.map((e) => (
                <tr key={e._id}>
                  <td className="px-5 py-3 font-mono text-xs text-neutral-500">{e.orderRef}</td>
                  <td className="px-5 py-3 text-neutral-800">{e.planName}</td>
                  <td className="px-5 py-3 text-red-500 text-xs">{e.failReason || "Unknown"}</td>
                  <td className="px-5 py-3 text-neutral-500">{e.retryCount}/3</td>
                  <td className="px-5 py-3 text-neutral-400 text-xs">{dateStr(e.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
