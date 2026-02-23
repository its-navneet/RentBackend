/**
 * Review Model
 * MongoDB schema for property reviews
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  _id: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  rating: number;
  safetyRating: number;
  lighting: number;
  entryAccess: number;
  wardenPresence: number;
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    default: 'Anonymous',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  safetyRating: {
    type: Number,
    default: 0,
    min: 1,
    max: 5,
  },
  lighting: {
    type: Number,
    default: 0,
    min: 1,
    max: 5,
  },
  entryAccess: {
    type: Number,
    default: 0,
    min: 1,
    max: 5,
  },
  wardenPresence: {
    type: Number,
    default: 0,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
ReviewSchema.index({ propertyId: 1 });

export const Review = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;

