import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserNotification extends Document {
  user:         mongoose.Types.ObjectId;
  announcement: mongoose.Types.ObjectId;
  isRead:       boolean;
  isDismissed:  boolean; // for banner dismissal
  readAt:       Date | null;
  dismissedAt:  Date | null;
  createdAt:    Date;
  updatedAt:    Date;
}

const UserNotificationSchema = new Schema<IUserNotification>(
  {
    user:         { type: Schema.Types.ObjectId, ref: "User",         required: true },
    announcement: { type: Schema.Types.ObjectId, ref: "Announcement", required: true },
    isRead:       { type: Boolean, default: false },
    isDismissed:  { type: Boolean, default: false },
    readAt:       { type: Date, default: null },
    dismissedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound unique — one notification record per user per announcement
UserNotificationSchema.index({ user: 1, announcement: 1 }, { unique: true });
// Fast unread count queries
UserNotificationSchema.index({ user: 1, isRead: 1 });
// Fast banner query
UserNotificationSchema.index({ user: 1, isDismissed: 1 });

const UserNotification: Model<IUserNotification> =
  mongoose.models.UserNotification ||
  mongoose.model<IUserNotification>("UserNotification", UserNotificationSchema);

export default UserNotification;
