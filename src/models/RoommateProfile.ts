/**
 * Roommate Profile Model
 * MongoDB schema for roommate matching profiles
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IRoommateProfile extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  branch: string;
  diet: 'veg' | 'non-veg' | 'jain';
  sleepSchedule: 'early-bird' | 'night-owl' | 'flexible';
  habits: string[];
  studyPreference: 'silent' | 'casual' | 'group';
  compatibilityScore: number;
}

const RoommateProfileSchema = new Schema<IRoommateProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  branch: {
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
  habits: [{
    type: String,
  }],
  studyPreference: {
    type: String,
    enum: ['silent', 'casual', 'group'],
    default: 'casual',
  },
  compatibilityScore: {
    type: Number,
    default: 0,
  },
});

// Index for faster queries
RoommateProfileSchema.index({ userId: 1 });

export const RoommateProfile = mongoose.model<IRoommateProfile>('RoommateProfile', RoommateProfileSchema);

export default RoommateProfile;

