/**
 * services/vtu/gladtidings.ts
 * GladtidingsData provider — TypeScript port for Mercy Hub
 * Covers: Data, Airtime, Cable TV, Education (Exam Pins)
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
  17: { provider: "gotv",      name: "GOtv Smallie - Monthly",    price: 1900  },
  22: { provider: "dstv",      name: "DStv Confam",               price: 11000 },
  23: { provider: "dstv",      name: "DStv Asia French",          price: 39000 },
  33: { provider: "dstv",      name: "DStv Padi",                 price: 4400  },
  34: { provider: "dstv",      name: "DStv Premium Extra View",   price: 24500 },
  35: { provider: "gotv",      name: "GOtv Smallie - Quarterly",  price: 5700  },
  36: { provider: "gotv",      name: "GOtv Smallie - Yearly",     price: 22800 },
  37: { provider: "startimes", name: "Nova (Dish) - 1 Week",      price: 700   },
  38: { provider: "startimes", name: "Basic (Antenna) - 1 Week",  price: 1400  },
  39: { provider: "startimes", name: "Smart - 1 Week",            price: 1700  },
  40: { provider: "startimes", name: "Classic (Antenna) - 1 Week",price: 2000  },
  41: { provider: "startimes", name: "Super (Dish) - 1 Week",     price: 3300  },
  47: { provider: "gotv",      name: "GOtv Jolli",                price: 5800  },
  48: { provider: "startimes", name: "Super (Antenna) - 1 Month", price: 9500  },
  49: { provider: "startimes", name: "Basic (Antenna) - 1 Month", price: 4000  },
  50: { provider: "startimes", name: "Classic (Dish) - 1 Month",  price: 7400  },
  51: { provider: "startimes", name: "Basic (Dish) - 1 Month",    price: 5100  },
  52: { provider: "gotv",      name: "GOtv Supa Monthly",         price: 11400 },
  54: { provider: "startimes", name: "Nova (Antenna) - 1 Month",  price: 2100  },
  55: { provider: "gotv",      name: "GOtv Supa Plus Monthly",    price: 16800 },
  56: { provider: "dstv",      name: "DStv Compact XtraView",     price: 24000 },
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
  return {
    "Content-Type": "application/json",
    Authorization: `Token ${apiKey}`,
  };
}

function normalizeNetwork(net: string): string {
  const n = (net || "").toLowerCase();
  if (n.includes("mtn"))    return "mtn";
  if (n.includes("airtel")) return "airtel";
  if (n.includes("glo"))    return "glo";
  if (n.includes("9mobile") || n.includes("etisalat")) return "9mobile";
  return n;
}

function normalizePhone(phone: string): string {
  phone = (phone || "").toString().trim().replace(/\s+/g, "").replace(/-/g, "");
  if (phone.startsWith("+234"))                          phone = "0" + phone.slice(4);
  if (phone.startsWith("234") && phone.length === 13)   phone = "0" + phone.slice(3);
  if (!phone.startsWith("0") && phone.length === 10)    phone = "0" + phone;
  return phone;
}

function handleError(e: unknown, context: string): VtuResult {
  const err = e as { response?: { data?: { message?: string; detail?: string; error?: string } }; message?: string };
  const msg = err.response?.data?.message || err.response?.data?.detail || err.response?.data?.error || err.message || "Unknown error";
  console.error(`[GladtidingsData] ${context} error:`, msg);
  return { success: false, error: msg, provider: "gladtidings" };
}

// ─── Wallet Balance ──────────────────────────────────────────
export async function getProviderBalance(): Promise<{ success: boolean; balance?: number; error?: string }> {
  const apiKey = process.env.GLADTIDINGS_API_KEY;
  if (!apiKey) return { success: false, error: "GLADTIDINGS_API_KEY not set" };
  try {
    const r = await fetch(`${BASE_URL}/user/`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(10000),
    });
    const data = await r.json();
    const balance = parseFloat(
      data.user?.wallet_balance || data.user?.Account_Balance ||
      data.wallet_balance || data.Account_Balance || data.balance || 0
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
  if (!apiKey) return [];

  try {
    const r = await fetch(`${BASE_URL}/user/`, {
      headers: getHeaders(),
      signal: AbortSignal.timeout(15000),
    });
    const data = await r.json();
    const Dataplans = data?.Dataplans;
    if (!Dataplans) return [];

    const GTD_NET: Record<string, string> = {
      MTN_PLAN: "mtn", GLO_PLAN: "glo", AIRTEL_PLAN: "airtel", "9MOBILE_PLAN": "9mobile",
    };

    const plans: DataPlan[] = [];
    for (const [planKey, planGroups] of Object.entries(Dataplans as Record<string, unknown>)) {
      const network = GTD_NET[planKey];
      if (!network) continue;
      const groups = planGroups as Record<string, unknown[]>;
      const raw = (groups.ALL || groups[Object.keys(groups)[0]]) as unknown[];
      if (!Array.isArray(raw)) continue;

      for (const item of raw as Record<string, unknown>[]) {
        const planId  = item.dataplan_id || item.id;
        const cost    = parseFloat(String(item.plan_amount || 0));
        const rawName = String(item.plan || "").trim();
        if (!planId || !cost || !rawName || cost > 500000) continue;

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
          validity:       String(item.month_validate || ""),
          cost,
          planType:       mapPlanType(String(item.plan_type || "")),
          network,
          providerPlanId: String(planId),
        });
      }
    }

    // Deduplicate: keep cheapest per unique key
    const planMap: Record<string, DataPlan> = {};
    for (const plan of plans) {
      if (!planMap[plan.id] || plan.cost < planMap[plan.id].cost) {
        planMap[plan.id] = plan;
      }
    }

    const deduped = Object.values(planMap);
    _planCache = { plans: deduped, fetchedAt: now };
    console.log(`[GladTidings] Loaded ${deduped.length} data plans`);
    return deduped;
  } catch (e) {
    console.warn("[GladTidings] fetchDataPlans error:", (e as Error).message);
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
  if (!networkId) return { success: false, error: `Unknown network: ${params.network}`, provider: "gladtidings" };

  try {
    const payload = {
      network:       networkId,
      mobile_number: normalizePhone(params.phone),
      plan:          Number(params.planId),
      Ported_number: params.ported ?? true,
      ref:           params.ref,
    };
    console.log("[GladTidings] buyData request:", JSON.stringify(payload));

    const r    = await fetch(`${BASE_URL}/data/`, {
      method: "POST", headers: getHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
    const d = await r.json();
    console.log("[GladTidings] buyData response:", JSON.stringify(d));

    const ok = d.Status === "successful" || d.status === "successful";
    return {
      success:   ok,
      reference: d.id || d.ident,
      message:   d.api_response || d.message || (ok ? "Data delivered successfully" : "Data purchase failed"),
      provider:  "gladtidings",
      raw:       d,
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
  if (!networkId) return { success: false, error: `Unknown network: ${params.network}`, provider: "gladtidings" };

  try {
    const r = await fetch(`${BASE_URL}/topup/`, {
      method: "POST", headers: getHeaders(),
      body: JSON.stringify({
        network:       networkId,
        mobile_number: normalizePhone(params.phone),
        Ported_number: true,
        airtime_type:  "VTU",
        amount:        Number(params.amount),
      }),
      signal: AbortSignal.timeout(30000),
    });
    const d = await r.json();
    const ok = d.Status === "successful" || d.status === "successful";
    return {
      success:   ok,
      reference: d.id,
      message:   d.api_response || d.message || (ok ? "Airtime delivered" : "Airtime purchase failed"),
      provider:  "gladtidings",
      raw:       d,
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
  const cableId = CABLE_MAP[(params.provider || "").toLowerCase()];
  if (!cableId) return { success: false, error: `Unknown cable provider: ${params.provider}`, provider: "gladtidings" };

  try {
    const r = await fetch(`${BASE_URL}/cablesub/`, {
      method: "POST", headers: getHeaders(),
      body: JSON.stringify({
        cabletv_name:      cableId,
        smart_card_number: params.smartcard,
        plan:              params.planId,
        phone:             normalizePhone(params.phone),
      }),
      signal: AbortSignal.timeout(30000),
    });
    const d = await r.json();
    const ok = d.Status === "successful" || d.status === "successful";
    return {
      success:   ok,
      reference: d.id,
      message:   d.api_response || d.message || (ok ? "Cable subscription activated" : "Cable subscription failed"),
      provider:  "gladtidings",
      raw:       d,
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
    return { success: false, error: `Invalid exam. Use: ${validExams.join(", ")}`, provider: "gladtidings" };
  }

  try {
    const r = await fetch(`${BASE_URL}/epin/`, {
      method: "POST", headers: getHeaders(),
      body: JSON.stringify({ exam_name: exam, quantity: Number(params.quantity || 1) }),
      signal: AbortSignal.timeout(30000),
    });
    const d = await r.json();
    const ok = d.Status === "successful";
    return {
      success:  ok,
      reference:d.id,
      pins:     d.pins || [],
      examName: d.exam_name,
      amount:   d.amount,
      message:  d.message || (ok ? "Exam pin purchased" : "Exam pin purchase failed"),
      provider: "gladtidings",
      raw:      d,
    };
  } catch (e) {
    return handleError(e, "buyExamPin");
  }
}
