/**
 * Dispute Model
 * Tracks tenant-owner disputes for admin resolution.
 */

import mongoose, { Document, Schema } from "mongoose";

export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";
export type DisputeAction =
  | "none"
  | "warn_user"
  | "refund_deposit"
  | "penalize_owner"
  | "ban_tenant";

export interface IDispute extends Document {
  _id: mongoose.Types.ObjectId;
  raisedByUserId: mongoose.Types.ObjectId;
  againstUserId?: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  bookingRequestId?: mongoose.Types.ObjectId;
  stayRecordId?: mongoose.Types.ObjectId;
  ledgerEntryId?: mongoose.Types.ObjectId;
  category: string;
  title: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolutionNotes?: string;
  adminAction: DisputeAction;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeSchema = new Schema<IDispute>({
  raisedByUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  againstUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    default: null,
  },
  bookingRequestId: {
    type: Schema.Types.ObjectId,
    ref: "BookingRequest",
    default: null,
  },
  stayRecordId: {
    type: Schema.Types.ObjectId,
    ref: "StayRecord",
    default: null,
  },
  ledgerEntryId: {
    type: Schema.Types.ObjectId,
    ref: "LedgerEntry",
    default: null,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  evidence: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ["open", "under_review", "resolved", "rejected"],
    default: "open",
  },
  resolutionNotes: {
    type: String,
    default: "",
  },
  adminAction: {
    type: String,
    enum: [
      "none",
      "warn_user",
      "refund_deposit",
      "penalize_owner",
      "ban_tenant",
    ],
    default: "none",
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  resolvedAt: {
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

DisputeSchema.index({ status: 1, createdAt: -1 });
DisputeSchema.index({ raisedByUserId: 1, createdAt: -1 });
DisputeSchema.index({ againstUserId: 1, createdAt: -1 });

export const Dispute = mongoose.model<IDispute>("Dispute", DisputeSchema);

export default Dispute;
