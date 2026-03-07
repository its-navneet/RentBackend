/**
 * Report Model
 * Tracks complaints/reports submitted by users for moderation.
 */

import mongoose, { Document, Schema } from "mongoose";

export type ReportStatus =
  | "open"
  | "investigating"
  | "action_taken"
  | "dismissed";
export type ReportAction =
  | "none"
  | "warn_user"
  | "suspend_account"
  | "remove_listing";

export interface IReport extends Document {
  _id: mongoose.Types.ObjectId;
  reporterUserId: mongoose.Types.ObjectId;
  reportedUserId?: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  reason: string;
  details?: string;
  evidence: string[];
  status: ReportStatus;
  actionTaken: ReportAction;
  adminNotes?: string;
  handledBy?: mongoose.Types.ObjectId;
  handledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  reporterUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  reportedUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    default: null,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  details: {
    type: String,
    default: "",
    trim: true,
  },
  evidence: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ["open", "investigating", "action_taken", "dismissed"],
    default: "open",
  },
  actionTaken: {
    type: String,
    enum: ["none", "warn_user", "suspend_account", "remove_listing"],
    default: "none",
  },
  adminNotes: {
    type: String,
    default: "",
  },
  handledBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  handledAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reporterUserId: 1, createdAt: -1 });
ReportSchema.index({ reportedUserId: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>("Report", ReportSchema);

export default Report;
