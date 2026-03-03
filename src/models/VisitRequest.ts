/**
 * Visit Request Model
 * MongoDB schema for property visit requests in booking lifecycle
 */

import mongoose, { Document, Schema } from "mongoose";

export type VisitRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed";

export interface IVisitRequest extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  requestedDate: Date;
  status: VisitRequestStatus;
  notes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitRequestSchema = new Schema<IVisitRequest>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requestedDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed"],
    default: "pending",
  },
  notes: {
    type: String,
    default: "",
  },
  rejectionReason: {
    type: String,
    default: "",
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

// Indexes
VisitRequestSchema.index({ tenantId: 1, propertyId: 1 });
VisitRequestSchema.index({ ownerId: 1, status: 1 });
VisitRequestSchema.index({ propertyId: 1, status: 1 });

export const VisitRequest = mongoose.model<IVisitRequest>(
  "VisitRequest",
  VisitRequestSchema,
);

export default VisitRequest;
