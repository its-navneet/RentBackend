import express, { Request, Response } from 'express';
import db from '../services/db';
import { Review, IReview } from '../models/Review';
import { Property } from '../models/Property';
import mongoose from 'mongoose';

const router = express.Router();

// GET /api/reviews - Get all reviews
router.get('/', async (req: Request, res: Response) => {
  try {
    const { propertyId, userId } = req.query;
    const reviews: any[] = [];
    
    const snapshot = await db.collection('reviews').get();
    snapshot.forEach((doc: any) => {
      reviews.push(doc.data());
    });

    // Apply filters
    let filteredReviews = reviews;
    if (propertyId) {
      // Get property to check its reviews
      const propertyDoc = await db.collection('properties').doc(propertyId as string).get();
      if (propertyDoc.exists) {
        const propertyData = propertyDoc.data();
        const propertyReviewIds = propertyData?.reviews || [];
        filteredReviews = filteredReviews.filter(r => propertyReviewIds.includes(r.id || r._id));
      }
    }
    if (userId) {
      filteredReviews = filteredReviews.filter(r => r.userId === userId);
    }

    res.json({
      success: true,
      data: filteredReviews,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reviews',
    });
  }
});

// GET /api/reviews/:id - Get review by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('reviews').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }

    res.json({
      success: true,
      data: doc.data(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch review',
    });
  }
});

// POST /api/reviews - Create a new review
router.post('/', async (req: Request, res: Response) => {
  try {
    const { propertyId, userId, userName, rating, safetyRating, lighting, entryAccess, wardenPresence, comment } = req.body;

    if (!propertyId || !userId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'propertyId, userId, and rating are required',
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

    const review = new Review({
      propertyId: new mongoose.Types.ObjectId(propertyId),
      userId: new mongoose.Types.ObjectId(userId),
      userName: userName || 'Anonymous',
      rating,
      safetyRating: safetyRating || rating,
      lighting: lighting || rating,
      entryAccess: entryAccess || rating,
      wardenPresence: wardenPresence || rating,
      comment: comment || '',
    });

    await review.save();

    // Update property's reviews array
    const propertyData = propertyDoc.data();
    const reviews = propertyData?.reviews || [];
    await db.collection('properties').doc(propertyId).update({
      reviews: [...reviews, review._id.toString()],
    });

    // Recalculate average safety rating
    const allReviews: any[] = [];
    const reviewsSnapshot = await db.collection('reviews').get();
    reviewsSnapshot.forEach((doc: any) => {
      allReviews.push(doc.data());
    });
    const propertyReviews = allReviews.filter(r => reviews.includes(r.id || r._id));
    const avgSafetyRating = propertyReviews.length > 0 
      ? propertyReviews.reduce((sum, r) => sum + (r.safetyRating || r.rating), 0) / propertyReviews.length 
      : 0;
    await db.collection('properties').doc(propertyId).update({
      safetyRating: Math.round(avgSafetyRating * 10) / 10,
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create review',
    });
  }
});

// PUT /api/reviews/:id - Update review
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const doc = await db.collection('reviews').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }

    res.json({
      success: true,
      data: review,
      message: 'Review updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update review',
    });
  }
});

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('reviews').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
      });
    }

    const reviewData = doc.data();

    await Review.findByIdAndDelete(id);

    // Update property's reviews array
    if (reviewData?.propertyId) {
      const propertyDoc = await db.collection('properties').doc(reviewData.propertyId).get();
      if (propertyDoc.exists) {
        const propertyData = propertyDoc.data();
        const reviews = propertyData?.reviews || [];
        await db.collection('properties').doc(reviewData.propertyId).update({
          reviews: reviews.filter((rId: string) => rId !== id),
        });
      }
    }

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete review',
    });
  }
});

export default router;

