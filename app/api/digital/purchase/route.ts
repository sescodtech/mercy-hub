/**
 * app/api/digital/purchase/route.ts
 * POST /api/digital/purchase
 *
 * Two-phase flow:
 *   1. Debit user wallet (wallet) OR verify Paystack payment
 *   2. Dispatch to GladTidings
 *   3. On provider failure → refund wallet, mark order failed
 */

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@/lib/auth";
import { connectDB }                 from "@/lib/db";
import { DigitalOrder }              from "@/lib/models/DigitalModels";
import {
  getDigitalConfig,
  applyMarkup,
  debitWallet,
  creditWallet,
  generateDigitalRef,
  DigitalCategory,
} from "@/services/vtu/helpers";
import {
  buyData,
  buyAirtime,
  buyCable,
  buyExamPin,
  fetchDataPlans,
  CABLE_PLANS,
} from "@/services/vtu/gladtidings";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Please sign in to continue" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const {
      category,
      // data / airtime
      network, phone,
      // data specific
      providerPlanId, planName,
      // airtime specific
      amount: airtimeAmount,
      // cable
      cableProvider, smartcard, planId: cablePlanId,
      // education
      examName, quantity,
      // payment
      paymentMethod, paystackRef,
    } = body;

    if (!category) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 });
    }

    const config = await getDigitalConfig();
    const userId = session.user.id as string;

    // ── Resolve cost price and plan description ─────────────────
    let costPrice  = 0;
    let planLabel  = "";
    let planQty    = Number(quantity) || 1;
    let resolvedPlanId: string | undefined;

    if (category === "data") {
      if (!network || !phone || !providerPlanId || !planName) {
        return NextResponse.json({ success: false, error: "Missing: network, phone, providerPlanId, planName" }, { status: 400 });
      }
      const plans = await fetchDataPlans();
      const plan  = plans.find(p => p.providerPlanId === providerPlanId || p.id === providerPlanId);
      if (!plan) return NextResponse.json({ success: false, error: "Plan not found" }, { status: 400 });
      costPrice      = plan.cost;
      planLabel      = plan.name;
      resolvedPlanId = plan.providerPlanId;
    }

    else if (category === "airtime") {
      if (!network || !phone || !airtimeAmount) {
        return NextResponse.json({ success: false, error: "Missing: network, phone, amount" }, { status: 400 });
      }
      costPrice = Number(airtimeAmount);
      planLabel = `${network.toUpperCase()} ₦${costPrice.toLocaleString("en-NG")} Airtime`;
    }

    else if (category === "cable") {
      if (!cableProvider || !smartcard || !cablePlanId) {
        return NextResponse.json({ success: false, error: "Missing: cableProvider, smartcard, planId" }, { status: 400 });
      }
      const cplan = CABLE_PLANS[Number(cablePlanId)];
      if (!cplan) return NextResponse.json({ success: false, error: "Cable plan not found" }, { status: 400 });
      costPrice = cplan.price;
      planLabel = `${cplan.name} (${cableProvider.toUpperCase()})`;
    }

    else if (category === "education") {
      if (!examName) {
        return NextResponse.json({ success: false, error: "Missing: examName" }, { status: 400 });
      }
      const EXAM_PRICES: Record<string, number> = { WAEC: 900, NECO: 700, NABTEB: 750 };
      const examKey = (examName as string).toUpperCase();
      costPrice = (EXAM_PRICES[examKey] || 900) * planQty;
      planLabel = `${examKey} Result Checker${planQty > 1 ? ` ×${planQty}` : ""}`;
    }

    else {
      return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
    }

    const customerPrice = applyMarkup(costPrice, category as DigitalCategory, config);
    const orderRef      = generateDigitalRef();

    // ── Phase 1: Payment ────────────────────────────────────────
    if (paymentMethod === "wallet") {
      const debited = await debitWallet(userId, customerPrice, `${planLabel} purchase`, orderRef);
      if (!debited) {
        return NextResponse.json({
          success: false,
          error:   "Insufficient wallet balance. Please top up and try again.",
        }, { status: 402 });
      }
    } else if (paymentMethod === "paystack") {
      // Paystack reference must have been verified by the frontend via /api/payments/paystack/verify
      // We re-check it here as an extra safety net
      if (!paystackRef) {
        return NextResponse.json({ success: false, error: "Missing Paystack reference" }, { status: 400 });
      }
      // Verify with Paystack
      const verify = await fetch(`https://api.paystack.co/transaction/verify/${paystackRef}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      const verifyData = await verify.json();
      if (!verifyData.data || verifyData.data.status !== "success") {
        return NextResponse.json({ success: false, error: "Payment not verified" }, { status: 402 });
      }
      const paid = verifyData.data.amount / 100; // Paystack amount is in kobo
      if (paid < customerPrice) {
        return NextResponse.json({ success: false, error: "Payment amount mismatch" }, { status: 402 });
      }
    } else {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
    }

    // ── Create pending order ─────────────────────────────────────
    const order = await DigitalOrder.create({
      orderRef,
      user:          userId,
      category,
      network:       network || undefined,
      phone:         phone   || undefined,
      smartcard:     smartcard || undefined,
      examName:      examName  || undefined,
      planId:        resolvedPlanId || String(cablePlanId || ""),
      planName:      planLabel,
      quantity:      planQty,
      amount:        customerPrice,
      costPrice,
      paymentMethod,
      paystackRef:   paystackRef || undefined,
      status:        "processing",
    });

    // ── Phase 2: Provider dispatch ──────────────────────────────
    let result;

    try {
      if (category === "data") {
        result = await buyData({
          planId:  resolvedPlanId!,
          phone:   phone as string,
          network: network as string,
          ref:     orderRef,
        });
      } else if (category === "airtime") {
        result = await buyAirtime({
          network: network as string,
          phone:   phone as string,
          amount:  costPrice,
        });
      } else if (category === "cable") {
        result = await buyCable({
          provider:  cableProvider as string,
          smartcard: smartcard as string,
          planId:    Number(cablePlanId),
          phone:     phone as string,
        });
      } else if (category === "education") {
        result = await buyExamPin({ examName: examName as string, quantity: planQty });
      }
    } catch (dispatchErr) {
      result = { success: false, error: (dispatchErr as Error).message, provider: "gladtidings" };
    }

    // ── Phase 3: Update order status ─────────────────────────────
    if (result?.success) {
      await DigitalOrder.findByIdAndUpdate(order._id, {
        status:      "fulfilled",
        providerRef: String(result.reference || ""),
        ...(result.pins ? { pins: result.pins } : {}),
      });

      return NextResponse.json({
        success:  true,
        orderRef,
        message:  result.message || "Order fulfilled successfully",
        pins:     result.pins || undefined,
      });
    } else {
      // Refund wallet if wallet payment failed on provider side
      if (paymentMethod === "wallet") {
        await creditWallet(userId, customerPrice, `Refund: ${planLabel} failed`, orderRef);
      }
      await DigitalOrder.findByIdAndUpdate(order._id, {
        status:      "failed",
        failReason:  result?.error || "Provider dispatch failed",
      });

      return NextResponse.json({
        success: false,
        orderRef,
        error:   result?.error || "Service dispatch failed. Your payment has been refunded.",
        refunded: paymentMethod === "wallet",
      }, { status: 502 });
    }
  } catch (error) {
    console.error("[POST /api/digital/purchase]", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
