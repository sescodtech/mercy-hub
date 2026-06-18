"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, RefreshCw, X } from "lucide-react";
import type { PurchaseResult } from "../types";

interface Props {
  result: PurchaseResult | null;
  onClose: () => void;
}

export function ResultModal({ result, onClose }: Props) {
  return (
    <AnimatePresence>
      {result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-neutral-100 p-8 text-center max-w-md w-full relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700">
              <X className="w-4 h-4" />
            </button>

            {result.success ? (
              <>
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="font-semibold text-neutral-900 text-xl mb-2">Order Successful!</h2>
                <p className="text-neutral-500 text-sm mb-1">{result.message}</p>
                {result.orderRef && <p className="text-xs text-neutral-400 mb-4">Ref: {result.orderRef}</p>}
                {result.pins && result.pins.length > 0 && (
                  <div className="rounded-xl p-4 mb-5 text-left" style={{ backgroundColor: "rgba(217,140,42,0.08)", border: "1px solid rgba(217,140,42,0.2)" }}>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Your Exam Pins</p>
                    {result.pins.map((pin, i) => (
                      <p key={i} className="font-mono text-lg font-bold text-center" style={{ color: "#d98c2a" }}>{pin}</p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="font-semibold text-neutral-900 text-xl mb-2">Order Failed</h2>
                <p className="text-neutral-500 text-sm mb-4">{result.error}</p>
                {result.orderRef && <p className="text-xs text-neutral-400 mb-4">Ref: {result.orderRef}</p>}
              </>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={onClose}
                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: "#c47020" }}
              >
                <RefreshCw className="w-4 h-4" /> New Purchase
              </button>
              <Link
                href="/dashboard/digital-orders"
                className="flex items-center gap-2 border border-neutral-200 text-neutral-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-50 transition-colors"
              >
                View Orders
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
