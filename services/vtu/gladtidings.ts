/**
 * services/vtu/gladtidings.ts
 * GladTidings VTU provider — robust implementation for Mercy Hub
 */

const BASE_URL = "https://www.gladtidingsdata.com/api";

// ─── Network IDs ─────────────────────────────────────────────
export const NETWORK_MAP: Record<string, number> = {
  mtn: 1, glo: 2, airtel: 3, "9mobile": 6, etisalat: 6,
};

// ─── Cable IDs ───────────────────────────────────────────────
export const CABLE_MAP: Record<string, number> = {
  gotv: 1, dstv: 2, startimes: 3, startime: 3,
};

// ─── Cable Plan Catalog ──────────────────────────────────────
export const CABLE_PLANS: Record<number, { provider: string; name: string; price: number }> = {
  2:  { provider: "gotv",      name: "GOtv Max",                  price: 8500  },
  6:  { provider: "dstv",      name: "DStv Yanga",                price: 6000  },
  7:  { provider: "dstv",      name: "DStv Compact",              price: 19000 },
  8:  { provider: "dstv",      name: "DStv Compact Plus",         price: 30000 },
  9:  { provider: "dstv",      name: "DStv Premium",              price: 44500 },
  16: { provider: "gotv",      name: "GOtv Jinja",                price: 3900  },
  17: { provider: "gotv",      name: "GOtv Smallie Monthly",      price: 1900  },
  22: { provider: "dstv",      name: "DStv Confam",               price: 11000 },
  33: { provider: "dstv",      name: "DStv Padi",                 price: 4400  },
  35: { provider: "gotv",      name: "GOtv Smallie Quarterly",    price: 5700  },
  36: { provider: "gotv",      name: "GOtv Smallie Yearly",       price: 22800 },
  37: { provider: "startimes", name: "Nova Dish 1 Week",          price: 700   },
  38: { provider: "startimes", name: "Basic Antenna 1 Week",      price: 1400  },
  39: { provider: "startimes", name: "Smart 1 Week",              price: 1700  },
  47: { provider: "gotv",      name: "GOtv Jolli",                price: 5800  },
  48: { provider: "startimes", name: "Super Antenna 1 Month",     price: 9500  },
  49: { provider: "startimes", name: "Basic Antenna 1 Month",     price: 4000  },
  52: { provider: "gotv",      name: "GOtv Supa Monthly",         price: 11400 },
  55: { provider: "gotv",      name: "GOtv Supa Plus Monthly",    price: 16800 },
};

// ─── Types ───────────────────────────────────────────────────
export interface VtuResult {
  success: boolean;
  reference?: string | number;
  message?: string;
  error?: string;
  provider: string;
  raw?: unknown;
}

export interface DataPlan {
  id: string;
  name: string;
  validity: string;
  cost: number;
  planType: string;
  network: string;
  providerPlanId: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function getHeaders() {
  const apiKey = process.env.GLADTIDINGS_API_KEY;
  if (!apiKey) {
    throw new Error("GLADTIDINGS_API_KEY is not set in environment variables");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Token ${apiKey}`,
  };
}

function normalizeNetwork(net: string): string {
  const n = (net || "").toLowerCase();
  if (n.includes("mtn"))                              return "mtn";
  if (n.includes("airtel"))                           return "airtel";
  if (n.includes("glo"))                              return "glo";
  if (n.includes("9mobile") || n.includes("etisalat"))return "9mobile";
  return n;
}

function normalizePhone(phone: string): string {
  phone = (phone || "").toString().trim().replace(/\s+/g, "").replace(/-/g, "");
  if (phone.startsWith("+234"))                        phone = "0" + phone.slice(4);
  if (phone.startsWith("234") && phone.length === 13)  phone = "0" + phone.slice(3);
  if (!phone.startsWith("0") && phone.length === 10)   phone = "0" + phone;
  return phone;
}

function handleError(e: unknown, context: string): VtuResult {
  const err = e as {
    response?: { data?: { message?: string; detail?: string; error?: string } };
    message?: string;
  };
  const msg =
    err.response?.data?.message ||
    err.response?.data?.detail  ||
    err.response?.data?.error   ||
    err.message                 ||
    "Unknown error";
  console.error(`[GladTidings] ${context} error:`, msg);
  return { success: false, error: msg, provider: "gladtidings" };
}

// ─── Provider Balance ────────────────────────────────────────
export async function getProviderBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
  const apiKey = process.env.GLADTIDINGS_API_KEY;
  if (!apiKey) return { success: false, error: "GLADTIDINGS_API_KEY not set in Vercel environment variables" };

  try {
    const r = await fetch(`${BASE_URL}/user/`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) {
      const text = await r.text();
      return { success: false, error: `GladTidings returned ${r.status}: ${text.slice(0, 100)}` };
    }

    const data = await r.json();
    const balance = parseFloat(
      data.user?.wallet_balance  ||
      data.user?.Account_Balance ||
      data.wallet_balance        ||
      data.Account_Balance       ||
      data.balance               || "0"
    );
    return { success: true, balance };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

// ─── Dynamic Plan Fetching ───────────────────────────────────
let _planCache: { plans: DataPlan[]; fetchedAt: number } = { plans: [], fetchedAt: 0 };
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchDataPlans(): Promise<DataPlan[]> {
  const now = Date.now();
  if (now - _planCache.fetchedAt < CACHE_TTL && _planCache.plans.length > 0) {
    return _planCache.plans;
  }

  const apiKey = process.env.GLADTIDINGS_API_KEY;
  if (!apiKey) {
    console.error("[GladTidings] GLADTIDINGS_API_KEY is not set");
    return [];
  }

  try {
    const r = await fetch(`${BASE_URL}/user/`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(15000),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error(`[GladTidings] fetchDataPlans HTTP ${r.status}:`, text.slice(0, 200));
      return _planCache.plans;
    }

    const data = await r.json();
    const Dataplans = data?.Dataplans;

    if (!Dataplans) {
      console.error("[GladTidings] No Dataplans in response. Keys:", Object.keys(data));
      return [];
    }

    const GTD_NET: Record<string, string> = {
      MTN_PLAN: "mtn", GLO_PLAN: "glo", AIRTEL_PLAN: "airtel", "9MOBILE_PLAN": "9mobile",
    };

    const plans: DataPlan[] = [];

    for (const [planKey, planGroups] of Object.entries(Dataplans as Record<string, unknown>)) {
      const network = GTD_NET[planKey];
      if (!network) continue;

      const groups = planGroups as Record<string, unknown[]>;

      // Try ALL first, then first available group
      const raw = (groups.ALL || groups[Object.keys(groups)[0]] || []) as Record<string, unknown>[];
      if (!Array.isArray(raw) || raw.length === 0) continue;

      for (const item of raw) {
        const planId  = item.dataplan_id || item.id;
        const cost    = parseFloat(String(item.plan_amount || item.price || 0));
        const rawName = String(item.plan || item.plan_name || "").trim();

        if (!planId || !cost || !rawName || cost > 500000) continue;

        // Filter out unrealistically expensive small plans
        const sizeMatch = rawName.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|TB))/i);
        if (sizeMatch) {
          const sizeVal     = parseFloat(sizeMatch[1]);
          const isMB        = sizeMatch[0].toLowerCase().includes("mb");
          const effectiveGB = isMB ? sizeVal / 1024 : sizeVal;
          if (effectiveGB < 10 && cost > 50000) continue;
        }

        const planLabel    = sizeMatch
          ? sizeMatch[1].toUpperCase().replace(/\s+/g, "")
          : rawName.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

        const networkLabel = network === "9mobile" ? "9mobile" : network.toUpperCase();
        const dedupeKey    = `${network}_${planLabel}`.toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]/g, "");
        const uid          = `gtd_${dedupeKey}`;

        plans.push({
          id:             uid,
          name:           `${networkLabel} ${planLabel}`,
          validity:       String(item.month_validate || item.validity || ""),
          cost,
          planType:       mapPlanType(String(item.plan_type || "")),
          network,
          providerPlanId: String(planId),
        });
      }
    }

    // Deduplicate — keep cheapest per key
    const planMap: Record<string, DataPlan> = {};
    for (const plan of plans) {
      if (!planMap[plan.id] || plan.cost < planMap[plan.id].cost) {
        planMap[plan.id] = plan;
      }
    }

    const deduped = Object.values(planMap).sort((a, b) =>
      a.network.localeCompare(b.network) || a.cost - b.cost
    );

    _planCache = { plans: deduped, fetchedAt: now };
    console.log(`[GladTidings] Loaded ${deduped.length} data plans`);
    return deduped;

  } catch (e) {
    console.error("[GladTidings] fetchDataPlans exception:", (e as Error).message);
    return _planCache.plans; // return stale cache on error
  }
}

function mapPlanType(raw: string): string {
  const t = (raw || "").toUpperCase();
  if (t.includes("SME2"))      return "sme2";
  if (t.includes("SME"))       return "sme";
  if (t.includes("CORPORATE")) return "corporate";
  return "gifting";
}

// ─── Data Purchase ───────────────────────────────────────────
export async function buyData(params: {
  planId: string;
  phone: string;
  network: string;
  ported?: boolean;
  ref: string;
}): Promise<VtuResult> {
  const apiKey = process.env.GLADTIDINGS_API_KEY;
  if (!apiKey) return { success: false, error: "GLADTIDINGS_API_KEY not set", provider: "gladtidings" };

  const net       = normalizeNetwork(params.network);
  const networkId = NETWORK_MAP[net];
  if (!networkId) {
    return { success: false, error: `Unknown network: ${params.network}. Supported: MTN, Glo, Airtel, 9mobile`, provider: "gladtidings" };
  }

  try {
    const payload = {
      network:       networkId,
      mobile_number: normalizePhone(params.phone),
      plan:          Number(params.planId),
      Ported_number: params.ported ?? true,
      ref:           params.ref,
    };
    console.log("[GladTidings] buyData payload:", JSON.stringify(payload));

    const r = await fetch(`${BASE_URL}/data/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const d = await r.json();
    console.log("[GladTidings] buyData response:", JSON.stringify(d));

    const ok = d.Status === "successful" || d.status === "successful";
    if (!ok) {
      // Log full response so we can debug from Vercel logs
      console.error("[GladTidings] buyData failed:", JSON.stringify(d));
    }

    return {
      success:   ok,
      reference: d.id || d.ident,
      message:   d.api_response || d.message || (ok ? "Data delivered successfully" : "Data purchase failed"),
      provider:  "gladtidings",
      raw:       d,
      ...(!ok && { error: d.api_response || d.message || d.error || "Data purchase failed" }),
    };
  } catch (e) {
    return handleError(e, "buyData");
  }
}

// ─── Airtime Purchase ────────────────────────────────────────
export async function buyAirtime(params: {
  network: string;
  phone: string;
  amount: number;
}): Promise<VtuResult> {
  const apiKey = process.env.GLADTIDINGS_API_KEY;
  if (!apiKey) return { success: false, error: "GLADTIDINGS_API_KEY not set", provider: "gladtidings" };

  const net       = normalizeNetwork(params.network);
  const networkId = NETWORK_MAP[net];
  if (!networkId) {
    return { success: false, error: `Unknown network: ${params.network}`, provider: "gladtidings" };
  }

  try {
    const payload = {
      network:       networkId,
      mobile_number: normalizePhone(params.phone),
      Ported_number: true,
      airtime_type:  "VTU",
      amount:        Number(params.amount),
    };
    console.log("[GladTidings] buyAirtime payload:", JSON.stringify(payload));

    const r = await fetch(`${BASE_URL}/topup/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const d = await r.json();
    console.log("[GladTidings] buyAirtime response:", JSON.stringify(d));

    const ok = d.Status === "successful" || d.status === "successful";
    return {
      success:   ok,
      reference: d.id,
      message:   d.api_response || d.message || (ok ? "Airtime delivered" : "Airtime purchase failed"),
      provider:  "gladtidings",
      raw:       d,
      ...(!ok && { error: d.api_response || d.message || d.error || "Airtime purchase failed" }),
    };
  } catch (e) {
    return handleError(e, "buyAirtime");
  }
}

// ─── Cable TV ────────────────────────────────────────────────
export async function buyCable(params: {
  provider: string;
  smartcard: string;
  planId: number;
  phone: string;
}): Promise<VtuResult> {
  const apiKey = process.env.GLADTIDINGS_API_KEY;
  if (!apiKey) return { success: false, error: "GLADTIDINGS_API_KEY not set", provider: "gladtidings" };

  const cableId = CABLE_MAP[(params.provider || "").toLowerCase()];
  if (!cableId) {
    return { success: false, error: `Unknown cable provider: ${params.provider}. Supported: GOtv, DStv, StarTimes`, provider: "gladtidings" };
  }

  try {
    const payload = {
      cabletv_name:      cableId,
      smart_card_number: params.smartcard,
      plan:              params.planId,
      phone:             normalizePhone(params.phone),
    };
    console.log("[GladTidings] buyCable payload:", JSON.stringify(payload));

    const r = await fetch(`${BASE_URL}/cablesub/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const d = await r.json();
    console.log("[GladTidings] buyCable response:", JSON.stringify(d));

    const ok = d.Status === "successful" || d.status === "successful";
    return {
      success:   ok,
      reference: d.id,
      message:   d.api_response || d.message || (ok ? "Cable subscription activated" : "Cable subscription failed"),
      provider:  "gladtidings",
      raw:       d,
      ...(!ok && { error: d.api_response || d.message || d.error || "Cable subscription failed" }),
    };
  } catch (e) {
    return handleError(e, "buyCable");
  }
}

// ─── Education (Exam Pin) ─────────────────────────────────────
export async function buyExamPin(params: {
  examName: string;
  quantity?: number;
}): Promise<VtuResult & { pins?: string[]; examName?: string; amount?: number }> {
  const apiKey = process.env.GLADTIDINGS_API_KEY;
  if (!apiKey) return { success: false, error: "GLADTIDINGS_API_KEY not set", provider: "gladtidings" };

  const validExams = ["WAEC", "NECO", "NABTEB"];
  const exam = (params.examName || "").toUpperCase();
  if (!validExams.includes(exam)) {
    return { success: false, error: `Invalid exam. Supported: ${validExams.join(", ")}`, provider: "gladtidings" };
  }

  try {
    const payload = { exam_name: exam, quantity: Number(params.quantity || 1) };
    console.log("[GladTidings] buyExamPin payload:", JSON.stringify(payload));

    const r = await fetch(`${BASE_URL}/epin/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const d = await r.json();
    console.log("[GladTidings] buyExamPin response:", JSON.stringify(d));

    const ok = d.Status === "successful";
    return {
      success:   ok,
      reference: d.id,
      pins:      d.pins || [],
      examName:  d.exam_name,
      amount:    d.amount,
      message:   d.message || (ok ? "Exam pin purchased" : "Exam pin purchase failed"),
      provider:  "gladtidings",
      raw:       d,
      ...(!ok && { error: d.message || d.error || "Exam pin purchase failed" }),
    };
  } catch (e) {
    return handleError(e, "buyExamPin");
  }
}
