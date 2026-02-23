/**
 * User Model
 * MongoDB schema for users
 */

import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'student' | 'owner';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  phone: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  verified: boolean;
  backgroundCheckStatus?: 'pending' | 'approved' | 'rejected';
}

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
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'owner'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  backgroundCheckStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
});

// Index for faster queries
UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

export default User;

