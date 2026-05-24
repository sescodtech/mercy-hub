import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  businessName: string;
  tagline: string;
  logo: string;
  favicon: string;
  email: string;
  supportEmail: string;
  phone: string[];
  whatsapp: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  website: string;
  social: {
    instagram: string;
    facebook: string;
    twitter: string;
    tiktok: string;
    youtube: string;
    linkedin: string;
  };
  footer: {
    description: string;
    copyright: string;
    links: { label: string; href: string }[];
  };
  about: string;
  meta: {
    title: string;
    description: string;
    keywords: string[];
  };
  shipping: {
    freeShippingThreshold: number;
    defaultShippingCost: number;
    currency: string;
  };
  payments: {
    paystackEnabled: boolean;
    flutterwaveEnabled: boolean;
    codEnabled: boolean;
  };
  notifications: {
    orderEmail: boolean;
    orderWhatsapp: boolean;
    adminEmail: string;
    adminPhone: string;
  };
  maintenance: boolean;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    businessName:  { type: String, default: "Mercy Home Essentials" },
    tagline:       { type: String, default: "Premium Home Goods" },
    logo:          { type: String, default: "" },
    favicon:       { type: String, default: "" },
    email:         { type: String, default: "" },
    supportEmail:  { type: String, default: "" },
    phone:         { type: [String], default: [] },
    whatsapp:      { type: String, default: "" },
    address: {
      street:     { type: String, default: "" },
      city:       { type: String, default: "" },
      state:      { type: String, default: "" },
      country:    { type: String, default: "Nigeria" },
      postalCode: { type: String, default: "" },
    },
    website: { type: String, default: "" },
    social: {
      instagram: { type: String, default: "" },
      facebook:  { type: String, default: "" },
      twitter:   { type: String, default: "" },
      tiktok:    { type: String, default: "" },
      youtube:   { type: String, default: "" },
      linkedin:  { type: String, default: "" },
    },
    footer: {
      description: { type: String, default: "" },
      copyright:   { type: String, default: "" },
      links:       { type: [{ label: String, href: String }], default: [] },
    },
    about: { type: String, default: "" },
    meta: {
      title:       { type: String, default: "" },
      description: { type: String, default: "" },
      keywords:    { type: [String], default: [] },
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 50000 },
      defaultShippingCost:   { type: Number, default: 2500 },
      currency:              { type: String, default: "NGN" },
    },
    payments: {
      paystackEnabled:    { type: Boolean, default: true },
      flutterwaveEnabled: { type: Boolean, default: false },
      codEnabled:         { type: Boolean, default: true },
    },
    notifications: {
      orderEmail:    { type: Boolean, default: true },
      orderWhatsapp: { type: Boolean, default: false },
      adminEmail:    { type: String, default: "" },
      adminPhone:    { type: String, default: "" },
    },
    maintenance: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Singleton — always one document
SettingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) settings = await this.create({});
  return settings;
};

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
