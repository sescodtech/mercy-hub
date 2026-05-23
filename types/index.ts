// ─── User ────────────────────────────────────────────────────
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  avatar?: string;
  phone?: string;
  isVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  addresses: IAddress[];
  wishlist: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  _id?: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
}

// ─── Product ─────────────────────────────────────────────────
export interface IProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: IProductImage[];
  category: ICategory | string;
  subCategory?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  variants: IVariant[];
  attributes: IAttribute[];
  tags: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isActive: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  flashSale?: IFlashSale;
  weight?: number;
  dimensions?: IDimensions;
  seo?: ISEOMeta;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductImage {
  url: string;
  publicId?: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface IVariant {
  _id?: string;
  name: string;
  value: string;
  price?: number;
  stock?: number;
  sku?: string;
  image?: string;
}

export interface IAttribute {
  name: string;
  value: string;
}

export interface IFlashSale {
  isActive: boolean;
  discountPercent: number;
  startDate: Date;
  endDate: Date;
}

export interface IDimensions {
  length: number;
  width: number;
  height: number;
  unit: "cm" | "in";
}

export interface ISEOMeta {
  title?: string;
  description?: string;
  keywords?: string[];
}

// ─── Category ────────────────────────────────────────────────
export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: string;
  isActive: boolean;
  productCount?: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Review ──────────────────────────────────────────────────
export interface IReview {
  _id: string;
  product: string;
  user: Pick<IUser, "_id" | "name" | "avatar">;
  rating: number;
  title: string;
  body: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  isApproved: boolean;
  createdAt: Date;
}

// ─── Order ───────────────────────────────────────────────────
export interface IOrder {
  _id: string;
  orderNumber: string;
  user: Pick<IUser, "_id" | "name" | "email">;
  items: IOrderItem[];
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  paymentMethod: "paystack" | "flutterwave" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentReference?: string;
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  coupon?: ICouponApplied;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  product: Pick<IProduct, "_id" | "name" | "slug" | "images">;
  variant?: Pick<IVariant, "name" | "value">;
  quantity: number;
  price: number;
  total: number;
}

export interface ICouponApplied {
  code: string;
  discount: number;
  type: "percent" | "fixed";
}

// ─── Coupon ──────────────────────────────────────────────────
export interface ICoupon {
  _id: string;
  code: string;
  description?: string;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt: Date;
}

// ─── Cart ────────────────────────────────────────────────────
export interface ICartItem {
  product: IProduct;
  variant?: IVariant;
  quantity: number;
}

export interface ICart {
  items: ICartItem[];
  subtotal: number;
  itemCount: number;
}

// ─── Banner ──────────────────────────────────────────────────
export interface IBanner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  link?: string;
  buttonText?: string;
  position: "hero" | "secondary" | "promotional";
  isActive: boolean;
  sortOrder: number;
  startDate?: Date;
  endDate?: Date;
}

// ─── Analytics ───────────────────────────────────────────────
export interface IAnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
}

// ─── API Responses ───────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: IPagination;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Filters ─────────────────────────────────────────────────
export interface IProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  tags?: string[];
  sort?: "newest" | "price_asc" | "price_desc" | "popular" | "rating";
  search?: string;
  page?: number;
  limit?: number;
}
