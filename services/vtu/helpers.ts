/**
 * services/vtu/helpers.ts
 * Shared helpers for the digital services feature:
 *  - wallet credit / debit
 *  - markup calculation
 *  - config loading (with DB-seeded defaults)
 *  - order ref generation
 */

import { connectDB }                                         from "@/lib/db";
import { DigitalWallet, DigitalConfig, IDigitalConfig }     from "@/lib/models/DigitalModels";
import mongoose                                              from "mongoose";

// ─── Order Ref ───────────────────────────────────────────────
export function generateDigitalRef(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MH-DIG-${Date.now()}-${rand}`;
}

// ─── Config / Markup ─────────────────────────────────────────
export async function getDigitalConfig(): Promise<IDigitalConfig> {
  await connectDB();
  let config = await DigitalConfig.findOne({ name: "default" });
  if (!config) {
    config = await DigitalConfig.create({
      name: "default",
      markup:   { data: 15, airtime: 5, cable: 20, education: 10 },
      services: { data: true, airtime: true, cable: true, education: true },
    });
  }
  return config;
}

export type DigitalCategory = "data" | "airtime" | "cable" | "education";

export function applyMarkup(costPrice: number, category: DigitalCategory, config: IDigitalConfig): number {
  const pct = config.markup[category] ?? 10;
  return Math.ceil(costPrice * (1 + pct / 100));
}

// ─── Wallet Operations ────────────────────────────────────────
export async function getWalletBalance(userId: string): Promise<number> {
  await connectDB();
  const wallet = await DigitalWallet.findOne({ user: new mongoose.Types.ObjectId(userId) });
  return wallet?.balance ?? 0;
}

export async function creditWallet(
  userId: string,
  amount: number,
  note = "",
  ref?: string
): Promise<void> {
  await connectDB();
  await DigitalWallet.findOneAndUpdate(
    { user: new mongoose.Types.ObjectId(userId) },
    {
      $inc:        { balance: amount },
      $set:        { updatedAt: new Date() },
      $push:       { ledger: { type: "credit", amount, note, date: new Date(), ref } },
      $setOnInsert:{ user: new mongoose.Types.ObjectId(userId), createdAt: new Date() },
    },
    { upsert: true, new: true }
  );
}

/** Returns false if insufficient balance, true if successfully debited */
export async function debitWallet(
  userId: string,
  amount: number,
  note = "",
  ref?: string
): Promise<boolean> {
  await connectDB();
  const wallet = await DigitalWallet.findOne({ user: new mongoose.Types.ObjectId(userId) });
  const current = Number(wallet?.balance ?? 0);
  if (current < amount) return false;

  await DigitalWallet.findOneAndUpdate(
    { user: new mongoose.Types.ObjectId(userId) },
    {
      $inc:  { balance: -amount },
      $set:  { updatedAt: new Date() },
      $push: { ledger: { type: "debit", amount, note, date: new Date(), ref } },
    }
  );
  return true;
}

export async function getWalletLedger(userId: string, limit = 20) {
  await connectDB();
  const wallet = await DigitalWallet.findOne({ user: new mongoose.Types.ObjectId(userId) });
  if (!wallet) return [];
  return (wallet.ledger as { type: string; amount: number; note: string; date: Date; ref?: string }[])
    .slice(-limit)
    .reverse();
}
