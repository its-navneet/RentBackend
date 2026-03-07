/**
 * Admin Notification Model
 * Stores platform-wide announcements and notifications triggered by admin.
 */

import mongoose, { Document, Schema } from "mongoose";

export type NotificationChannel = "push" | "email" | "in_app";

export interface IAdminNotification extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  message: string;
  channels: NotificationChannel[];
  targetRole: "all" | "tenant" | "owner";
  sentBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AdminNotificationSchema = new Schema<IAdminNotification>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  channels: {
    type: [String],
    enum: ["push", "email", "in_app"],
    default: ["in_app"],
  },
  targetRole: {
    type: String,
    enum: ["all", "tenant", "owner"],
    default: "all",
  },
  sentBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

AdminNotificationSchema.index({ createdAt: -1 });

export const AdminNotification = mongoose.model<IAdminNotification>(
  "AdminNotification",
  AdminNotificationSchema,
);

export default AdminNotification;
