/**
 * Booking Model
 * MongoDB schema for property bookings
 */

import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type OwnerResponse = 'pending' | 'accepted' | 'rejected';

export interface IBooking extends Document {
  _id: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  ownerResponse: OwnerResponse;
  visitDate: Date;
  status: BookingStatus;
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  propertyId: {
    type: Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerResponse: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  visitDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
BookingSchema.index({ propertyId: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;

