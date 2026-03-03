/**
 * Booking Request Model
 * MongoDB schema for property booking requests in booking lifecycle
 */

import mongoose, { Document, Schema } from "mongoose";

export type BookingRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "payment_pending"
  | "confirmed";

export interface IBookingRequest extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  visitRequestId?: mongoose.Types.ObjectId;
  status: BookingRequestStatus;
  proposedCheckInDate: Date;
  proposedCheckOutDate?: Date;
  depositAmount: number;
  monthlyRent: number;
  totalAmount: number;
  notes?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingRequestSchema = new Schema<IBookingRequest>({
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
  visitRequestId: {
    type: Schema.Types.ObjectId,
    ref: "VisitRequest",
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "payment_pending", "confirmed"],
    default: "pending",
  },
  proposedCheckInDate: {
    type: Date,
    required: true,
  },
  proposedCheckOutDate: {
    type: Date,
    default: null,
  },
  depositAmount: {
    type: Number,
    required: true,
  },
  monthlyRent: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
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
BookingRequestSchema.index({ tenantId: 1, propertyId: 1 });
BookingRequestSchema.index({ ownerId: 1, status: 1 });
BookingRequestSchema.index({ propertyId: 1, status: 1 });

export const BookingRequest = mongoose.model<IBookingRequest>(
  "BookingRequest",
  BookingRequestSchema,
);

export default BookingRequest;
