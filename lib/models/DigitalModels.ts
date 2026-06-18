/**
 * lib/models/DigitalModels.ts
 * Mongoose models for the Digital Services feature (Data, Airtime, Cable, Education)
 * Add this file to your lib/models/ directory and export from lib/models/index.ts
 */

import mongoose, { Schema, Document, Model } from "mongoose";

// ─── DigitalOrder ─────────────────────────────────────────────
// Records every digital service purchase: data, airtime, cable, education
export interface IDigitalOrder extends Document {
  orderRef:      string;           // e.g. MH-DIG-1234567-AB3C
  user:          mongoose.Types.ObjectId;
  category:      "data" | "airtime" | "cable" | "education";
  network?:      string;           // mtn | airtel | glo | 9mobile
  phone?:        string;           // destination phone (data/airtime)
  smartcard?:    string;           // for cable TV
  examName?:     string;           // for education pins
  planId?:       string;           // provider plan ID
  planName:      string;           // human-readable plan description
  quantity:      number;
  amount:        number;           // customer-facing price (with markup)
  costPrice:     number;           // our cost from GladTidings
  paymentMethod: "wallet" | "paystack";
  paystackRef?:  string;
  status:        "pending" | "processing" | "fulfilled" | "failed" | "refunded";
  providerRef?:  string;           // GladTidings transaction ID
  pins?:         string[];         // for education exam pins
  failReason?:   string;
  retryCount:    number;
  createdAt:     Date;
  updatedAt:     Date;
}

const DigitalOrderSchema = new Schema<IDigitalOrder>({
  orderRef:      { type: String, required: true, unique: true },
  user:          { type: Schema.Types.ObjectId, ref: "User", required: true },
  category:      { type: String, enum: ["data", "airtime", "cable", "education"], required: true },
  network:       { type: String },
  phone:         { type: String },
  smartcard:     { type: String },
  examName:      { type: String },
  planId:        { type: String },
  planName:      { type: String, required: true },
  quantity:      { type: Number, default: 1 },
  amount:        { type: Number, required: true },
  costPrice:     { type: Number, required: true },
  paymentMethod: { type: String, enum: ["wallet", "paystack"], required: true },
  paystackRef:   { type: String },
  status:        { type: String, enum: ["pending", "processing", "fulfilled", "failed", "refunded"], default: "pending" },
  providerRef:   { type: String },
  pins:          [{ type: String }],
  failReason:    { type: String },
  retryCount:    { type: Number, default: 0 },
}, { timestamps: true });

DigitalOrderSchema.index({ user: 1, createdAt: -1 });
DigitalOrderSchema.index({ status: 1 });
DigitalOrderSchema.index({ paystackRef: 1 }, { sparse: true });

// ─── DigitalWallet ────────────────────────────────────────────
// Per-user wallet for topping up and spending on digital services
export interface IWalletLedgerEntry {
  type:   "credit" | "debit";
  amount: number;
  note:   string;
  date:   Date;
  ref?:   string;
}

export interface IDigitalWallet extends Document {
  user:    mongoose.Types.ObjectId;
  balance: number;
  ledger:  IWalletLedgerEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const WalletLedgerSchema = new Schema<IWalletLedgerEntry>({
  type:   { type: String, enum: ["credit", "debit"], required: true },
  amount: { type: Number, required: true },
  note:   { type: String, default: "" },
  date:   { type: Date, default: Date.now },
  ref:    { type: String },
}, { _id: false });

const DigitalWalletSchema = new Schema<IDigitalWallet>({
  user:    { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  balance: { type: Number, default: 0, min: 0 },
  ledger:  { type: [WalletLedgerSchema], default: [] },
}, { timestamps: true });

DigitalWalletSchema.index({ user: 1 });

// ─── DigitalConfig ────────────────────────────────────────────
// Admin-controlled markup percentages and service toggles
export interface IEducationPlan {
  id:         string;     // e.g. "waec_1" — also used as providerPlanId on the storefront
  examName:   string;     // must match a provider-supported exam (see services/vtu/gladtidings.ts)
  name:       string;     // display name, e.g. "WAEC Result Checker"
  costPrice:  number;     // our cost
  quantity:   number;
  isActive:   boolean;
}

export interface IDigitalConfig extends Document {
  name:    string;                // always "default"
  markup: {
    data:      number;            // percentage e.g. 15 = 15%
    airtime:   number;
    cable:     number;
    education: number;
  };
  services: {
    data:      boolean;
    airtime:   boolean;
    cable:     boolean;
    education: boolean;
  };
  hiddenPlanIds:  string[];       // plan ids hidden from the storefront (data/airtime/cable)
  educationPlans: IEducationPlan[];
  updatedAt: Date;
}

const EducationPlanSchema = new Schema<IEducationPlan>({
  id:        { type: String, required: true },
  examName:  { type: String, required: true },
  name:      { type: String, required: true },
  costPrice: { type: Number, required: true },
  quantity:  { type: Number, default: 1 },
  isActive:  { type: Boolean, default: true },
}, { _id: false });

const DigitalConfigSchema = new Schema<IDigitalConfig>({
  name: { type: String, required: true, unique: true },
  markup: {
    data:      { type: Number, default: 15 },
    airtime:   { type: Number, default: 5  },
    cable:     { type: Number, default: 20 },
    education: { type: Number, default: 10 },
  },
  services: {
    data:      { type: Boolean, default: true },
    airtime:   { type: Boolean, default: true },
    cable:     { type: Boolean, default: true },
    education: { type: Boolean, default: true },
  },
  hiddenPlanIds:  { type: [String], default: [] },
  educationPlans: { type: [EducationPlanSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

// ─── DigitalDepositPending ────────────────────────────────────
// Tracks Paystack wallet top-ups that are pending webhook confirmation
export interface IDigitalDeposit extends Document {
  user:      mongoose.Types.ObjectId;
  reference: string;
  amount:    number;
  status:    "pending" | "verified" | "failed";
  createdAt: Date;
}

const DigitalDepositSchema = new Schema<IDigitalDeposit>({
  user:      { type: Schema.Types.ObjectId, ref: "User", required: true },
  reference: { type: String, required: true, unique: true },
  amount:    { type: Number, required: true },
  status:    { type: String, enum: ["pending", "verified", "failed"], default: "pending" },
}, { timestamps: true });

DigitalDepositSchema.index({ reference: 1 });
DigitalDepositSchema.index({ user: 1, createdAt: -1 });

// ─── DigitalPromo ─────────────────────────────────────────────
// Powers both "Hot Deals" and "Promo Products" sections on the
// Digital Services marketplace page. Admin-managed (see /admin/digital-services).
// A promo always points at a real category (and optionally a specific
// provider plan) so the price shown is always live, never a stale/static
// number that could drift from what the customer is actually charged.
export interface IDigitalPromo extends Document {
  type:        "deal" | "promo";   // "deal" = Hot Deals section, "promo" = Promo Products section
  title:       string;
  subtitle?:   string;
  category:    "data" | "airtime" | "cable" | "education" | "other";
  badge?:      string;             // e.g. "Hot", "Best Value", "Limited Time"
  network?:    string;             // mtn | airtel | glo | 9mobile — for data/airtime promos
  providerPlanId?: string;         // ties the card to a specific live plan, so price is always accurate
  ctaLabel?:   string;             // defaults to "Buy Now" in the UI if omitted
  imageUrl?:   string;             // optional banner/illustration for promo products
  isActive:    boolean;
  sortOrder:   number;
  expiresAt?:  Date;
  createdAt:   Date;
  updatedAt:   Date;
}

const DigitalPromoSchema = new Schema<IDigitalPromo>({
  type:           { type: String, enum: ["deal", "promo"], required: true },
  title:          { type: String, required: true },
  subtitle:       { type: String },
  category:       { type: String, enum: ["data", "airtime", "cable", "education", "other"], required: true },
  badge:          { type: String },
  network:        { type: String },
  providerPlanId: { type: String },
  ctaLabel:       { type: String },
  imageUrl:       { type: String },
  isActive:       { type: Boolean, default: true },
  sortOrder:       { type: Number, default: 0 },
  expiresAt:      { type: Date },
}, { timestamps: true });

DigitalPromoSchema.index({ type: 1, isActive: 1, sortOrder: 1 });

// ─── Model exports ────────────────────────────────────────────
function getOrCreate<T extends Document>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] || mongoose.model<T>(name, schema)) as Model<T>;
}

export const DigitalOrder   = getOrCreate<IDigitalOrder>  ("DigitalOrder",   DigitalOrderSchema);
export const DigitalWallet  = getOrCreate<IDigitalWallet> ("DigitalWallet",  DigitalWalletSchema);
export const DigitalConfig  = getOrCreate<IDigitalConfig> ("DigitalConfig",  DigitalConfigSchema);
export const DigitalDeposit = getOrCreate<IDigitalDeposit>("DigitalDeposit", DigitalDepositSchema);
export const DigitalPromo   = getOrCreate<IDigitalPromo>  ("DigitalPromo",   DigitalPromoSchema);
