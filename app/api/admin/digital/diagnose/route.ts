/**
 * app/api/admin/digital/diagnose/route.ts
 * GET /api/admin/digital/diagnose
 *
 * Tests the GladTidings API connection and shows exactly what is
 * working and what is failing. Admin only.
 * DELETE THIS ROUTE after debugging is done.
 */

import { NextResponse } from "next/server";
import { auth }         from "@/lib/auth";

const BASE_URL = "https://www.gladtidingsdata.com/api";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const apiKey = process.env.GLADTIDINGS_API_KEY;

    const report: Record<string, unknown> = {
      timestamp:       new Date().toISOString(),
      envVarSet:       !!apiKey,
      envVarPreview:   apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : "NOT SET",
      baseUrl:         BASE_URL,
      tests:           {},
    };

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        report,
        fix: "Add GLADTIDINGS_API_KEY to your Vercel environment variables. Get it from your GladTidings dashboard.",
      });
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Token ${apiKey}`,
    };

    // ── Test 1: User/Balance endpoint ──────────────────────────
    try {
      const r    = await fetch(`${BASE_URL}/user/`, { headers, signal: AbortSignal.timeout(10000) });
      const data = await r.json();
      const balance = parseFloat(
        data.user?.wallet_balance || data.user?.Account_Balance ||
        data.wallet_balance || data.Account_Balance || data.balance || "0"
      );
      const hasPlans = !!(data.Dataplans);
      const planCount = hasPlans
        ? Object.values(data.Dataplans as Record<string, Record<string, unknown[]>>)
            .flatMap(g => Object.values(g))
            .flatMap(arr => arr)
            .length
        : 0;

      (report.tests as Record<string, unknown>).userEndpoint = {
        status:   r.status,
        ok:       r.ok,
        balance,
        hasDataPlans: hasPlans,
        rawPlanCount: planCount,
        // Show the raw keys returned so we can debug structure
        topLevelKeys: Object.keys(data),
        dataplansKeys: hasPlans ? Object.keys(data.Dataplans) : [],
      };
    } catch (e) {
      (report.tests as Record<string, unknown>).userEndpoint = {
        error: (e as Error).message,
        ok: false,
      };
    }

    // ── Test 2: Data plans fetch ────────────────────────────────
    try {
      const r    = await fetch(`${BASE_URL}/user/`, { headers, signal: AbortSignal.timeout(10000) });
      const data = await r.json();
      const Dataplans = data?.Dataplans;

      if (Dataplans) {
        const GTD_NET: Record<string, string> = {
          MTN_PLAN: "mtn", GLO_PLAN: "glo", AIRTEL_PLAN: "airtel", "9MOBILE_PLAN": "9mobile",
        };
        const parsed: Record<string, number> = {};
        for (const [k, v] of Object.entries(Dataplans as Record<string, Record<string, unknown[]>>)) {
          const net = GTD_NET[k];
          if (!net) continue;
          const groups = v as Record<string, unknown[]>;
          const raw = groups.ALL || groups[Object.keys(groups)[0]] || [];
          parsed[net] = Array.isArray(raw) ? raw.length : 0;
        }
        (report.tests as Record<string, unknown>).dataPlans = {
          ok: true,
          plansByNetwork: parsed,
          totalRaw: Object.values(parsed).reduce((a, b) => a + b, 0),
        };
      } else {
        (report.tests as Record<string, unknown>).dataPlans = {
          ok: false,
          error: "No Dataplans key found in response",
          availableKeys: Object.keys(data),
          fullResponse: JSON.stringify(data).slice(0, 500),
        };
      }
    } catch (e) {
      (report.tests as Record<string, unknown>).dataPlans = { ok: false, error: (e as Error).message };
    }

    // ── Test 3: Airtime endpoint (dry run — no actual purchase) ─
    try {
      // Just check if the endpoint is reachable by sending minimal invalid data
      const r = await fetch(`${BASE_URL}/topup/`, {
        method: "POST", headers,
        body: JSON.stringify({ network: 1, mobile_number: "0000000000", amount: 0, Ported_number: true, airtime_type: "VTU" }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await r.json();
      (report.tests as Record<string, unknown>).airtimeEndpoint = {
        status:     r.status,
        reachable:  true,
        response:   JSON.stringify(data).slice(0, 200),
      };
    } catch (e) {
      (report.tests as Record<string, unknown>).airtimeEndpoint = {
        reachable: false,
        error: (e as Error).message,
      };
    }

    // ── Summary ─────────────────────────────────────────────────
    const userOk  = !!(report.tests as Record<string, Record<string, unknown>>).userEndpoint?.ok;
    const plansOk = !!(report.tests as Record<string, Record<string, unknown>>).dataPlans?.ok;

    return NextResponse.json({
      success: userOk && plansOk,
      summary: userOk && plansOk
        ? "✅ GladTidings API is connected and working correctly."
        : "❌ GladTidings API has issues. See report.tests for details.",
      report,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
