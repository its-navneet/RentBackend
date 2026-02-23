/**
 * Owner Profile Model
 * MongoDB schema for owner profiles
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IOwnerProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  phone: string;
  name: string;
  role: 'owner';
  createdAt: Date;
  verified: boolean;
  businessName: string;
  properties: mongoose.Types.ObjectId[];
  backgroundCheckComplete: boolean;
  previousTenantReferences: string[];
  backgroundCheckStatus?: 'pending' | 'approved' | 'rejected';
}

const OwnerProfileSchema = new Schema<IOwnerProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['owner'],
    default: 'owner',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  businessName: {
    type: String,
    default: '',
  },
  properties: [{
    type: Schema.Types.ObjectId,
    ref: 'Property',
  }],
  backgroundCheckComplete: {
    type: Boolean,
    default: false,
  },
  previousTenantReferences: [{
    type: String,
  }],
  backgroundCheckStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
});

// Index for faster queries
OwnerProfileSchema.index({ userId: 1 });
// OwnerProfileSchema.index({ email: 1 });

export const OwnerProfile = mongoose.model<IOwnerProfile>('OwnerProfile', OwnerProfileSchema);

export default OwnerProfile;

