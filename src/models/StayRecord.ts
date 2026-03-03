/**
 * Stay Record Model
 * MongoDB schema for tracking active tenancy periods
 */

import mongoose, { Document, Schema } from "mongoose";

export type StayRecordStatus =
  | "upcoming"
  | "active"
  | "notice_period"
  | "completed"
  | "cancelled";

export interface IStayRecord extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  bookingRequestId: mongoose.Types.ObjectId;
  status: StayRecordStatus;
  checkInDate: Date;
  checkOutDate?: Date;
  noticeGivenDate?: Date;
  noticeExpiryDate?: Date;
  monthlyRent: number;
  depositAmount: number;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StayRecordSchema = new Schema<IStayRecord>({
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
  bookingRequestId: {
    type: Schema.Types.ObjectId,
    ref: "BookingRequest",
    required: true,
  },
  status: {
    type: String,
    enum: ["upcoming", "active", "notice_period", "completed", "cancelled"],
    default: "upcoming",
  },
  checkInDate: {
    type: Date,
    required: true,
  },
  checkOutDate: {
    type: Date,
    default: null,
  },
  noticeGivenDate: {
    type: Date,
    default: null,
  },
  noticeExpiryDate: {
    type: Date,
    default: null,
  },
  monthlyRent: {
    type: Number,
    required: true,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  cancellationReason: {
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
StayRecordSchema.index({ tenantId: 1, propertyId: 1 });
StayRecordSchema.index({ ownerId: 1, status: 1 });
StayRecordSchema.index({ propertyId: 1, status: 1 });
StayRecordSchema.index({ status: 1 });

export const StayRecord = mongoose.model<IStayRecord>(
  "StayRecord",
  StayRecordSchema,
);

export default StayRecord;
