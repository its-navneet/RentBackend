/**
 * User Model
 * MongoDB schema for users in PG ecosystem
 */

import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "tenant" | "owner" | "admin";
export type Gender = "male" | "female" | "other";
export type VerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "on_review";

export interface IRatingSummary {
  averageRating: number;
  totalRatings: number;
  recentRatings: number[];
}

export interface IVerificationMeta {
  phoneVerified: boolean;
  idVerified: boolean;
  businessVerified: boolean;
  badge: "none" | "verified_owner";
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  phone: string;
  name: string;
  role: UserRole;
  gender: Gender;
  profileImage?: string;
  bio?: string;
  createdAt: Date;
  verified: boolean;
  verificationStatus: VerificationStatus;
  backgroundCheckStatus?: "pending" | "approved" | "rejected";
  ratingSummary?: IRatingSummary;
  verificationMeta?: IVerificationMeta;
  isActive: boolean;
  isBlocked: boolean;
  blockedUsers?: mongoose.Types.ObjectId[];
  updatedAt: Date;
}

const RatingSummarySchema = new Schema<IRatingSummary>({
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  recentRatings: [
    {
      type: Number,
      min: 1,
      max: 5,
    },
  ],
});

const VerificationMetaSchema = new Schema<IVerificationMeta>({
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  idVerified: {
    type: Boolean,
    default: false,
  },
  businessVerified: {
    type: Boolean,
    default: false,
  },
  badge: {
    type: String,
    enum: ["none", "verified_owner"],
    default: "none",
  },
});

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["tenant", "owner", "admin"],
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    default: "other",
  },
  profileImage: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected", "on_review"],
    default: "pending",
  },
  backgroundCheckStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  ratingSummary: {
    type: RatingSummarySchema,
    default: {},
  },
  verificationMeta: {
    type: VerificationMetaSchema,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
UserSchema.index({ role: 1 });
// Email index is created automatically by unique: true
UserSchema.index({ verified: 1 });

export const User = mongoose.model<IUser>("User", UserSchema);

export default User;
