/**
 * Review Model
 * MongoDB schema for multi-directional ratings in PG ecosystem
 * Supports: Owner→Tenant, Tenant→Owner, Tenant→Property
 */

import mongoose, { Document, Schema } from "mongoose";

export type RatingType =
  | "owner_to_tenant"
  | "tenant_to_owner"
  | "tenant_to_property";

export interface ITenantRatingCriteria {
  rentPunctuality?: number; // 1-5
  cleanliness?: number; // 1-5
  ruleAdherence?: number; // 1-5
  behaviour?: number; // 1-5
  damageResponsibility?: number; // 1-5
}

export interface IOwnerRatingCriteria {
  transparency?: number; // 1-5
  maintenanceResponse?: number; // 1-5
  respectfulBehaviour?: number; // 1-5
  depositHandling?: number; // 1-5
}

export interface IPropertyRatingCriteria {
  cleanliness?: number; // 1-5
  waterAvailability?: number; // 1-5
  electricity?: number; // 1-5
  wifi?: number; // 1-5
  safety?: number; // 1-5
  noise?: number; // 1-5
}

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  ratingType: RatingType;
  stayRecordId?: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  toUserId?: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  overallRating: number;
  tenantCriteria?: ITenantRatingCriteria;
  ownerCriteria?: IOwnerRatingCriteria;
  propertyCriteria?: IPropertyRatingCriteria;
  comment: string;
  isAnonymous: boolean;
  isLocked: boolean; // Can't edit after submission
  createdAt: Date;
  updatedAt: Date;
}

const TenantRatingCriteriaSchema = new Schema<ITenantRatingCriteria>({
  rentPunctuality: { type: Number, min: 1, max: 5 },
  cleanliness: { type: Number, min: 1, max: 5 },
  ruleAdherence: { type: Number, min: 1, max: 5 },
  behaviour: { type: Number, min: 1, max: 5 },
  damageResponsibility: { type: Number, min: 1, max: 5 },
});

const OwnerRatingCriteriaSchema = new Schema<IOwnerRatingCriteria>({
  transparency: { type: Number, min: 1, max: 5 },
  maintenanceResponse: { type: Number, min: 1, max: 5 },
  respectfulBehaviour: { type: Number, min: 1, max: 5 },
  depositHandling: { type: Number, min: 1, max: 5 },
});

const PropertyRatingCriteriaSchema = new Schema<IPropertyRatingCriteria>({
  cleanliness: { type: Number, min: 1, max: 5 },
  waterAvailability: { type: Number, min: 1, max: 5 },
  electricity: { type: Number, min: 1, max: 5 },
  wifi: { type: Number, min: 1, max: 5 },
  safety: { type: Number, min: 1, max: 5 },
  noise: { type: Number, min: 1, max: 5 },
});

const ReviewSchema = new Schema<IReview>({
  ratingType: {
    type: String,
    enum: ["owner_to_tenant", "tenant_to_owner", "tenant_to_property"],
    required: true,
  },
  stayRecordId: {
    type: Schema.Types.ObjectId,
    ref: "StayRecord",
    required: function () {
      return ["owner_to_tenant", "tenant_to_owner"].includes(this.ratingType);
    },
  },
  fromUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  toUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: function () {
      return this.ratingType !== "tenant_to_property";
    },
  },
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: function () {
      return this.ratingType === "tenant_to_property";
    },
  },
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  tenantCriteria: {
    type: TenantRatingCriteriaSchema,
    required: function () {
      return this.ratingType === "owner_to_tenant";
    },
  },
  ownerCriteria: {
    type: OwnerRatingCriteriaSchema,
    required: function () {
      return this.ratingType === "tenant_to_owner";
    },
  },
  propertyCriteria: {
    type: PropertyRatingCriteriaSchema,
    required: function () {
      return this.ratingType === "tenant_to_property";
    },
  },
  comment: {
    type: String,
    default: "",
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  isLocked: {
    type: Boolean,
    default: false,
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
ReviewSchema.index({ stayRecordId: 1, ratingType: 1 });
ReviewSchema.index({ fromUserId: 1, ratingType: 1 });
ReviewSchema.index({ toUserId: 1, ratingType: 1 });
ReviewSchema.index({ propertyId: 1, ratingType: 1 });

export const Review = mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
