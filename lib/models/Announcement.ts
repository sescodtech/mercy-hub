import mongoose, { Schema, Document, Model } from "mongoose";

export type AnnouncementType     = "info" | "success" | "warning" | "maintenance" | "update";
export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";
export type AnnouncementAudience = "all" | "customers" | "admins";

export interface IAnnouncement extends Document {
  title:        string;
  body:         string;
  type:         AnnouncementType;
  priority:     AnnouncementPriority;
  audience:     AnnouncementAudience;
  sendEmail:    boolean;
  sendInApp:    boolean;
  isPublished:  boolean;
  startDate:    Date;
  expiresAt:    Date | null;
  publishedAt:  Date | null;
  createdBy:    mongoose.Types.ObjectId;
  emailSentAt:  Date | null;
  emailSentCount: number;
  createdAt:    Date;
  updatedAt:    Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title:          { type: String, required: true, trim: true, maxlength: 200 },
    body:           { type: String, required: true },
    type:           { type: String, enum: ["info","success","warning","maintenance","update"], default: "info" },
    priority:       { type: String, enum: ["low","normal","high","urgent"], default: "normal" },
    audience:       { type: String, enum: ["all","customers","admins"], default: "all" },
    sendEmail:      { type: Boolean, default: false },
    sendInApp:      { type: Boolean, default: true },
    isPublished:    { type: Boolean, default: false },
    startDate:      { type: Date, default: Date.now },
    expiresAt:      { type: Date, default: null },
    publishedAt:    { type: Date, default: null },
    createdBy:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    emailSentAt:    { type: Date, default: null },
    emailSentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ isPublished: 1, startDate: 1, expiresAt: 1 });
AnnouncementSchema.index({ audience: 1, isPublished: 1 });

const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);

export default Announcement;
