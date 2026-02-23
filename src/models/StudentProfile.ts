/**
 * Student Preferences Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentPreferences {
  budget: { min: number; max: number };
  roomType: 'single' | 'double' | 'sharing';
  amenities: string[];
  safetyRating: number;
}

const StudentPreferencesSchema = new Schema<IStudentPreferences>({
  budget: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
  },
  roomType: {
    type: String,
    enum: ['single', 'double', 'sharing'],
    default: 'single',
  },
  amenities: [{
    type: String,
  }],
  safetyRating: {
    type: Number,
    default: 0,
  },
});

/**
 * Student Profile Model
 */

export interface IStudentProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  email: string;
  phone: string;
  name: string;
  role: 'student';
  createdAt: Date;
  verified: boolean;
  branch: string;
  college: string;
  diet: 'veg' | 'non-veg' | 'jain';
  sleepSchedule: 'early-bird' | 'night-owl' | 'flexible';
  preferences: IStudentPreferences;
}

const StudentProfileSchema = new Schema<IStudentProfile>({
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
    enum: ['student'],
    default: 'student',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  branch: {
    type: String,
    default: '',
  },
  college: {
    type: String,
    default: '',
  },
  diet: {
    type: String,
    enum: ['veg', 'non-veg', 'jain'],
    default: 'veg',
  },
  sleepSchedule: {
    type: String,
    enum: ['early-bird', 'night-owl', 'flexible'],
    default: 'flexible',
  },
  preferences: {
    type: StudentPreferencesSchema,
    default: () => ({}),
  },
});

// Index for faster queries
StudentProfileSchema.index({ userId: 1 });
// StudentProfileSchema.index({ email: 1 });

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);

export default StudentProfile;

