/**
 * Agreement Model
 * MongoDB schema for rental agreements
 */

import mongoose, { Document, Schema } from "mongoose";

export type AgreementStatus =
  | "draft"
  | "pending-sign"
  | "active"
  | "expired"
  | "terminated";

export interface IAgreement extends Document {
  _id: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  termsAndConditions: string;
  moveInDate: Date;
  duration: number;
  depositAmount: number;
  monthlyRent: number;
  customClauses: string[];
  signatureStudent?: string;
  signatureOwner?: string;
  tenantSignerName?: string;
  ownerSignerName?: string;
  tenantSignedAt?: Date;
  ownerSignedAt?: Date;
  status: AgreementStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AgreementSchema = new Schema<IAgreement>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  termsAndConditions: {
    type: String,
    default: "Standard rental agreement",
  },
  moveInDate: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  monthlyRent: {
    type: Number,
    required: true,
  },
  customClauses: [
    {
      type: String,
    },
  ],
  signatureStudent: {
    type: String,
  },
  signatureOwner: {
    type: String,
  },
  tenantSignerName: {
    type: String,
  },
  ownerSignerName: {
    type: String,
  },
  tenantSignedAt: {
    type: Date,
  },
  ownerSignedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["draft", "pending-sign", "active", "expired", "terminated"],
    default: "draft",
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

// Indexes for faster queries
AgreementSchema.index({ propertyId: 1 });

export const Agreement = mongoose.model<IAgreement>(
  "Agreement",
  AgreementSchema,
);

export default Agreement;
