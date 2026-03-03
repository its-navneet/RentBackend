/**
 * Ledger Entry Model
 * MongoDB schema for tracking rent and charges for each month
 */

import mongoose, { Document, Schema } from "mongoose";

export type LedgerStatus = "paid" | "partial" | "overdue";

export interface IChargeItem {
  type: "rent" | "electricity" | "food" | "laundry" | "penalty" | "custom";
  name: string;
  amount: number;
  description?: string;
}

export interface ILedgerEntry extends Document {
  _id: mongoose.Types.ObjectId;
  stayRecordId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  month: Date; // First day of the month
  charges: IChargeItem[];
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: LedgerStatus;
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChargeItemSchema = new Schema<IChargeItem>({
  type: {
    type: String,
    enum: ["rent", "electricity", "food", "laundry", "penalty", "custom"],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    default: "",
  },
});

const LedgerEntrySchema = new Schema<ILedgerEntry>({
  stayRecordId: {
    type: Schema.Types.ObjectId,
    ref: "StayRecord",
    required: true,
  },
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
  month: {
    type: Date,
    required: true,
  },
  charges: [ChargeItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  balance: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["paid", "partial", "overdue"],
    default: "overdue",
  },
  dueDate: {
    type: Date,
    required: true,
  },
  paidDate: {
    type: Date,
    default: null,
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
LedgerEntrySchema.index({ stayRecordId: 1, month: 1 });
LedgerEntrySchema.index({ tenantId: 1, month: -1 });
LedgerEntrySchema.index({ ownerId: 1, status: 1 });
LedgerEntrySchema.index({ propertyId: 1, month: -1 });

export const LedgerEntry = mongoose.model<ILedgerEntry>(
  "LedgerEntry",
  LedgerEntrySchema,
);

export default LedgerEntry;
