/**
 * Payment Model
 * MongoDB schema for tracking payments
 */

import mongoose, { Document, Schema } from "mongoose";

export type PaymentType =
  | "deposit"
  | "rent"
  | "electricity"
  | "food"
  | "laundry"
  | "penalty"
  | "custom";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  stayRecordId?: mongoose.Types.ObjectId;
  ledgerEntryId?: mongoose.Types.ObjectId;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  transactionId: string;
  paymentMethod: "upi" | "card" | "bank_transfer" | "cash";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
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
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    enum: [
      "deposit",
      "rent",
      "electricity",
      "food",
      "laundry",
      "penalty",
      "custom",
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  paymentMethod: {
    type: String,
    enum: ["upi", "card", "bank_transfer", "cash"],
    default: "bank_transfer",
  },
  notes: {
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
PaymentSchema.index({ tenantId: 1, createdAt: -1 });
PaymentSchema.index({ ownerId: 1, status: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ stayRecordId: 1 });

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
