/**
 * Property Model
 * MongoDB schema for properties
 */

import mongoose, { Document, Schema } from "mongoose";

export type PropertyType = "apartment" | "pg" | "hostel" | "flat";
export type PropertyStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "suspended";

export interface ILandmark {
  type: "bus-stop" | "market" | "college" | "hospital" | "park";
  name: string;
  distance: number;
  duration: number;
}

export interface IProperty extends Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: PropertyType;
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  budget: { min: number; max: number };
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  photos: string[];
  categorizedImages: {
    bedroom?: string[];
    bathroom?: string[];
    kitchen?: string[];
    living?: string[];
    balcony?: string[];
  };
  videoUrl: string;
  ownerVerified: boolean;
  ownerVerifiedAt?: Date;
  verified: boolean;
  verificationBadge: boolean;
  status: PropertyStatus;
  moderationNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  safetyRating: number;
  reviews: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  landmarks: ILandmark[];
  availableFrom: Date;
}

const LandmarkSchema = new Schema<ILandmark>({
  type: {
    type: String,
    enum: ["bus-stop", "market", "college", "hospital", "park"],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  distance: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
});

const PropertySchema = new Schema<IProperty>({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    enum: ["apartment", "pg", "hostel", "flat"],
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  budget: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  bedrooms: {
    type: Number,
    required: true,
  },
  bathrooms: {
    type: Number,
    default: 1,
  },
  amenities: [
    {
      type: String,
    },
  ],
  photos: [
    {
      type: String,
    },
  ],
  categorizedImages: {
    bedroom: [String],
    bathroom: [String],
    kitchen: [String],
    living: [String],
    balcony: [String],
  },
  videoUrl: {
    type: String,
    default: "",
  },
  ownerVerified: {
    type: Boolean,
    default: false,
  },
  ownerVerifiedAt: {
    type: Date,
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationBadge: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["pending_review", "approved", "rejected", "suspended"],
    default: "pending_review",
  },
  moderationNotes: {
    type: String,
    default: "",
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  safetyRating: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  landmarks: [LandmarkSchema],
  availableFrom: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
PropertySchema.index({ ownerId: 1 });
PropertySchema.index({ status: 1 });
// PropertySchema.index({ city: 1 });
// PropertySchema.index({ type: 1 });
// PropertySchema.index({ 'budget.min': 1, 'budget.max': 1 });
// PropertySchema.index({ bedrooms: 1 });
// PropertySchema.index({ verified: 1 });
// PropertySchema.index({ location: '2dsphere' });

export const Property = mongoose.model<IProperty>("Property", PropertySchema);

export default Property;
