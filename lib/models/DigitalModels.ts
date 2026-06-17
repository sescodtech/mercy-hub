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
DigitalOrderSchema.index({ orderRef: 1 });
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
  updatedAt: Date;
}

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

// ─── Model exports ────────────────────────────────────────────
function getOrCreate<T extends Document>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] || mongoose.model<T>(name, schema)) as Model<T>;
}

export const DigitalOrder   = getOrCreate<IDigitalOrder>  ("DigitalOrder",   DigitalOrderSchema);
export const DigitalWallet  = getOrCreate<IDigitalWallet> ("DigitalWallet",  DigitalWalletSchema);
export const DigitalConfig  = getOrCreate<IDigitalConfig> ("DigitalConfig",  DigitalConfigSchema);
export const DigitalDeposit = getOrCreate<IDigitalDeposit>("DigitalDeposit", DigitalDepositSchema);
