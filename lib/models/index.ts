import mongoose, { Schema, Document, Model } from "mongoose";
import { ColorVariantSchema } from "./Settings";

// ─── User Model ─────────────────────────────────────────────
const AddressSchema = new Schema({
  label:        { type: String, default: "Home" },
  firstName:    { type: String, required: true },
  lastName:     { type: String, required: true },
  phone:        { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city:         { type: String, required: true },
  state:        { type: String, required: true },
  country:      { type: String, required: true, default: "Nigeria" },
  postalCode:   { type: String },
  isDefault:    { type: Boolean, default: false },
});

const UserSchema = new Schema({
  name:                   { type: String, required: true, trim: true },
  email:                  { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:               { type: String, select: false },
  role:                   { type: String, enum: ["user", "admin"], default: "user" },
  avatar:                 { type: String },
  phone:                  { type: String },
  isVerified:             { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  passwordResetToken:     { type: String, select: false },
  passwordResetExpires:   { type: Date,   select: false },
  addresses:              [AddressSchema],
  wishlist:               [{ type: Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });

UserSchema.index({ email: 1 });

// ─── Category Model ─────────────────────────────────────────
const CategorySchema = new Schema({
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String },
  image:       { type: String },
  icon:        { type: String },
  parent:      { type: Schema.Types.ObjectId, ref: "Category" },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true } });

CategorySchema.index({ slug: 1 });

// ─── Product Model ──────────────────────────────────────────
const ProductImageSchema = new Schema({
  url:       { type: String, required: true },
  publicId:  { type: String },
  alt:       { type: String },
  isPrimary: { type: Boolean, default: false },
}, { _id: false });

// Legacy generic variant (size, etc.) — kept for backward-compat
const VariantSchema = new Schema({
  name:  { type: String, required: true },
  value: { type: String, required: true },
  price: { type: Number },
  stock: { type: Number },
  sku:   { type: String },
  image: { type: String },
});

const AttributeSchema = new Schema({
  name:  { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false });

const FlashSaleSchema = new Schema({
  isActive:        { type: Boolean, default: false },
  discountPercent: { type: Number, required: true },
  startDate:       { type: Date, required: true },
  endDate:         { type: Date, required: true },
}, { _id: false });

const ProductSchema = new Schema({
  name:             { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, lowercase: true },
  description:      { type: String, required: true },
  shortDescription: { type: String },
  images:           [ProductImageSchema],
  category:         { type: Schema.Types.ObjectId, ref: "Category", required: true },
  subCategory:      { type: String },
  price:            { type: Number, required: true, min: 0 },
  comparePrice:     { type: Number },
  costPrice:        { type: Number },
  sku:              { type: String, required: true, unique: true },
  barcode:          { type: String },
  stock:            { type: Number, default: 0, min: 0 },
  lowStockThreshold:{ type: Number, default: 5 },
  trackInventory:   { type: Boolean, default: true },

  // ── NEW: colour variant system ──
  colorVariants:    { type: [ColorVariantSchema], default: [] },
  hasColorVariants: { type: Boolean, default: false },

  // Legacy generic variants (size, material, etc.)
  variants:   [VariantSchema],
  attributes: [AttributeSchema],
  tags:       [{ type: String, lowercase: true }],
  rating:     { type: Number, default: 0, min: 0, max: 5 },
  reviewCount:{ type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
  isBestSeller:  { type: Boolean, default: false },
  isNewArrival:  { type: Boolean, default: false },
  flashSale:     FlashSaleSchema,
  weight:        { type: Number },
  dimensions: {
    length: Number, width: Number, height: Number,
    unit: { type: String, enum: ["cm", "in"], default: "cm" },
  },
  seo: {
    title:       { type: String },
    description: { type: String },
    keywords:    [{ type: String }],
  },
}, { timestamps: true, toJSON: { virtuals: true } });

ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ name: "text", description: "text", tags: "text" });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ isBestSeller: 1, isActive: 1 });
ProductSchema.index({ isNewArrival: 1, isActive: 1 });
// Fast lookup by colour variant SKU
ProductSchema.index({ "colorVariants.sku": 1 }, { sparse: true });

// ─── Review Model ───────────────────────────────────────────
const ReviewSchema = new Schema({
  product:            { type: Schema.Types.ObjectId, ref: "Product", required: true },
  user:               { type: Schema.Types.ObjectId, ref: "User",    required: true },
  rating:             { type: Number, required: true, min: 1, max: 5 },
  title:              { type: String, required: true, trim: true },
  body:               { type: String, required: true },
  images:             [{ type: String }],
  isVerifiedPurchase: { type: Boolean, default: false },
  helpfulVotes:       { type: Number, default: 0 },
  isApproved:         { type: Boolean, default: true },
}, { timestamps: true });

ReviewSchema.index({ product: 1, isApproved: 1 });
ReviewSchema.index({ user: 1 });

// ─── Order Model ────────────────────────────────────────────
const OrderItemSchema = new Schema({
  product:  { type: Schema.Types.ObjectId, ref: "Product", required: true },
  // Generic variant (size, etc.)
  variant: {
    name:  { type: String },
    value: { type: String },
  },
  // ── NEW: colour variant tracking ──
  colorVariant: {
    variantId: { type: Schema.Types.ObjectId },
    label:     { type: String },   // "Midnight Black" — denormalised for order history
    colorHex:  { type: String },   // "#1a1a1a"
    image:     { type: String },   // first image of that variant
  },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true },
  total:    { type: Number, required: true },
}, { _id: false });

const OrderSchema = new Schema({
  orderNumber:      { type: String, required: true, unique: true },
  user:             { type: Schema.Types.ObjectId, ref: "User", required: true },
  items:            [OrderItemSchema],
  shippingAddress:  { type: AddressSchema, required: true },
  billingAddress:   AddressSchema,
  paymentMethod:    { type: String, enum: ["paystack", "flutterwave", "cod"], required: true },
  paymentStatus:    { type: String, enum: ["pending","paid","failed","refunded"], default: "pending" },
  paymentReference: { type: String },
  orderStatus: {
    type: String,
    enum: ["pending","confirmed","processing","shipped","delivered","cancelled","returned"],
    default: "pending",
  },
  subtotal:           { type: Number, required: true },
  shippingCost:       { type: Number, default: 0 },
  discount:           { type: Number, default: 0 },
  tax:                { type: Number, default: 0 },
  total:              { type: Number, required: true },
  coupon: {
    code:     { type: String },
    discount: { type: Number },
    type:     { type: String, enum: ["percent", "fixed"] },
  },
  notes:              { type: String },
  trackingNumber:     { type: String },
  estimatedDelivery:  { type: Date },
  deliveredAt:        { type: Date },
  cancelledAt:        { type: Date },
  cancellationReason: { type: String },
}, { timestamps: true });

OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ paymentReference: 1 }, { unique: true, sparse: true });

// ─── Coupon Model ───────────────────────────────────────────
const CouponSchema = new Schema({
  code:                 { type: String, required: true, unique: true, uppercase: true },
  description:          { type: String },
  type:                 { type: String, enum: ["percent","fixed","free_shipping"], required: true },
  value:                { type: Number, required: true },
  minOrderAmount:       { type: Number },
  maxDiscountAmount:    { type: Number },
  usageLimit:           { type: Number },
  usageCount:           { type: Number, default: 0 },
  isActive:             { type: Boolean, default: true },
  startDate:            { type: Date },
  endDate:              { type: Date },
  applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  applicableProducts:   [{ type: Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });

// ─── Banner Model ───────────────────────────────────────────
const BannerSchema = new Schema({
  title:       { type: String, required: true },
  subtitle:    { type: String },
  image:       { type: String, required: true },
  mobileImage: { type: String },
  link:        { type: String },
  buttonText:  { type: String, default: "Shop Now" },
  position:    { type: String, enum: ["hero","secondary","promotional"], default: "hero" },
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  startDate:   { type: Date },
  endDate:     { type: Date },
}, { timestamps: true });

// ─── Export Models ──────────────────────────────────────────
function getOrCreateModel<T extends Document>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] || mongoose.model<T>(name, schema)) as Model<T>;
}

export const User     = getOrCreateModel("User",     UserSchema);
export const Category = getOrCreateModel("Category", CategorySchema);
export const Product  = getOrCreateModel("Product",  ProductSchema);
export const Review   = getOrCreateModel("Review",   ReviewSchema);
export const Order    = getOrCreateModel("Order",    OrderSchema);
export const Coupon   = getOrCreateModel("Coupon",   CouponSchema);
export const Banner   = getOrCreateModel("Banner",   BannerSchema);
export { default as Settings } from "./Settings";

// Digital Services
export { DigitalOrder, DigitalWallet, DigitalConfig, DigitalDeposit } from "./DigitalModels";
