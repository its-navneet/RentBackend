/**
 * Tenant Reliability Score Model
 * MongoDB schema for tracking tenant reliability metrics
 */

import mongoose, { Document, Schema } from "mongoose";

export type ReliabilityBadge =
  | "trusted_tenant"
  | "good_tenant"
  | "needs_review";

export interface ITenantReliabilityScore extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  score: number; // 0-100
  badge: ReliabilityBadge;
  paymentPunctualityScore: number; // Based on on-time payments
  ownerRatingAverage: number; // Average rating from owners
  complaintCount: number;
  totalStayDuration: number; // in months
  activeStays: number;
  completedStays: number;
  cancelledStays: number;
  createdAt: Date;
  updatedAt: Date;
}

const TenantReliabilityScoreSchema = new Schema<ITenantReliabilityScore>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  badge: {
    type: String,
    enum: ["trusted_tenant", "good_tenant", "needs_review"],
    default: "needs_review",
  },
  paymentPunctualityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  ownerRatingAverage: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  complaintCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalStayDuration: {
    type: Number,
    default: 0,
    min: 0,
  },
  activeStays: {
    type: Number,
    default: 0,
    min: 0,
  },
  completedStays: {
    type: Number,
    default: 0,
    min: 0,
  },
  cancelledStays: {
    type: Number,
    default: 0,
    min: 0,
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
TenantReliabilityScoreSchema.index({ tenantId: 1 });
TenantReliabilityScoreSchema.index({ score: -1 });
TenantReliabilityScoreSchema.index({ badge: 1 });

export const TenantReliabilityScore = mongoose.model<ITenantReliabilityScore>(
  "TenantReliabilityScore",
  TenantReliabilityScoreSchema,
);

export default TenantReliabilityScore;
