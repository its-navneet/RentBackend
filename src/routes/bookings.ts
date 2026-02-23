import express, { Request, Response } from 'express';
import db from '../services/db';
import { Booking, IBooking } from '../models/Booking';
import { Property } from '../models/Property';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/bookings - Get all bookings
router.get('/', async (req: Request, res: Response) => {
  try {
    const { studentId, ownerId, propertyId, status } = req.query;
    const bookings: any[] = [];
    
    const snapshot = await db.collection('bookings').get();
    snapshot.forEach((doc: any) => {
      bookings.push(doc.data());
    });

    // Apply filters
    let filteredBookings = bookings;
    if (studentId) {
      filteredBookings = filteredBookings.filter(b => b.studentId === studentId);
    }
    if (ownerId) {
      // Get properties owned by this owner
      const properties: any[] = [];
      const propSnapshot = await db.collection('properties').where('ownerId', '==', ownerId).get();
      propSnapshot.forEach((doc: any) => {
        properties.push(doc.data());
      });
      const ownerPropertyIds = properties.map(p => p.id);
      filteredBookings = filteredBookings.filter(b => ownerPropertyIds.includes(b.propertyId));
    }
    if (propertyId) {
      filteredBookings = filteredBookings.filter(b => b.propertyId === propertyId);
    }
    if (status) {
      filteredBookings = filteredBookings.filter(b => b.status === status);
    }

    res.json({
      success: true,
      data: filteredBookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch bookings',
    });
  }
});

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('bookings').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch booking',
    });
  }
});

// POST /api/bookings - Create a new booking
router.post('/', async (req: Request, res: Response) => {
  try {
    const { propertyId, studentId, visitDate } = req.body;

    if (!propertyId || !studentId || !visitDate) {
      return res.status(400).json({
        success: false,
        error: 'propertyId, studentId, and visitDate are required',
      });
    }

    // Check if property exists
    const propertyDoc = await db.collection('properties').doc(propertyId).get();
    if (!propertyDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    const booking = new Booking({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      studentId: new mongoose.Types.ObjectId(studentId),
      ownerResponse: 'pending',
      visitDate: new Date(visitDate),
      status: 'pending',
    });

    await booking.save();

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create booking',
    });
  }
});

// PUT /api/bookings/:id - Update booking (owner response)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ownerResponse, status, visitDate } = req.body;

    const doc = await db.collection('bookings').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const updates: any = {};
    if (ownerResponse) updates.ownerResponse = ownerResponse;
    if (status) updates.status = status;
    if (visitDate) updates.visitDate = new Date(visitDate);

    const booking = await Booking.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update booking',
    });
  }
});

// DELETE /api/bookings/:id - Cancel/delete booking
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('bookings').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    await Booking.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel booking',
    });
  }
});

export default router;

