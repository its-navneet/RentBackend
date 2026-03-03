/**
 * User Model
 * MongoDB schema for users in PG ecosystem
 */

import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "tenant" | "owner" | "admin";
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

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  phone: string;
  name: string;
  role: UserRole;
  profileImage?: string;
  bio?: string;
  createdAt: Date;
  verified: boolean;
  verificationStatus: VerificationStatus;
  backgroundCheckStatus?: "pending" | "approved" | "rejected";
  ratingSummary?: IRatingSummary;
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
