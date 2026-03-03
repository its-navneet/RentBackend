/**
 * Matching Routes
 * Endpoints for roommate matching functionality
 */

import express, { Request, Response } from "express";
import MatchProfile from "../models/MatchProfile";
import MatchingService from "../services/matching";
import User from "../models/User";

const router = express.Router();

/**
 * POST /api/matching/profile
 * Create or update user's match profile
 */
router.post("/profile", async (req: Request, res: Response) => {
  try {
    const { userId, lifestyle, interests, budgetRange, bio } = req.body;

    // Validate required fields
    if (!userId || !lifestyle || !budgetRange) {
      return res.status(400).json({
        error: "Missing required fields: userId, lifestyle, budgetRange",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const matchProfile = await MatchProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        userName: user.name,
        email: user.email,
        lifestyle,
        interests: interests || [],
        budgetRange,
        bio: bio || "",
      },
      { upsert: true, new: true },
    );

    res.json({
      message: "Match profile updated successfully",
      profile: matchProfile,
    });
  } catch (error) {
    console.error("Error updating match profile:", error);
    res.status(500).json({ error: "Failed to update match profile" });
  }
});

/**
 * GET /api/matching/profile/:userId
 * Get user's match profile
 */
router.get("/profile/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const profile = await MatchProfile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ error: "Match profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching match profile:", error);
    res.status(500).json({ error: "Failed to fetch match profile" });
  }
});

/**
 * GET /api/matching/find-matches/:userId
 * Find compatible matches for a user
 */
router.get("/find-matches/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const matches = await MatchingService.findMatches(userId, limit);

    res.json({
      totalMatches: matches.length,
      matches,
    });
  } catch (error: any) {
    console.error("Error finding matches:", error);
    res.status(500).json({
      error: error.message || "Failed to find matches",
    });
  }
});

/**
 * GET /api/matching/compatibility/:userId1/:userId2
 * Get compatibility score between two users
 */
router.get(
  "/compatibility/:userId1/:userId2",
  async (req: Request, res: Response) => {
    try {
      const { userId1, userId2 } = req.params;

      const profile1 = await MatchProfile.findOne({ userId: userId1 });
      const profile2 = await MatchProfile.findOne({ userId: userId2 });

      if (!profile1 || !profile2) {
        return res
          .status(404)
          .json({ error: "One or both profiles not found" });
      }

      const compatibility = MatchingService.calculateCompatibility(
        profile1,
        profile2,
      );

      res.json(compatibility);
    } catch (error) {
      console.error("Error calculating compatibility:", error);
      res.status(500).json({ error: "Failed to calculate compatibility" });
    }
  },
);

/**
 * POST /api/matching/show-interest
 * Mark interest in another user (for chat unlock)
 */
router.post("/show-interest", async (req: Request, res: Response) => {
  try {
    const { fromUserId, toUserId } = req.body;

    if (!fromUserId || !toUserId) {
      return res.status(400).json({
        error: "Missing required fields: fromUserId, toUserId",
      });
    }

    // TODO: Implement interest tracking in a separate collection
    // This is a placeholder for the mutual interest checking system

    res.json({
      message: "Interest recorded",
      fromUserId,
      toUserId,
    });
  } catch (error) {
    console.error("Error recording interest:", error);
    res.status(500).json({ error: "Failed to record interest" });
  }
});

/**
 * GET /api/matching/profile-by-interests
 * Search profiles by interests
 */
router.get("/profile-by-interests", async (req: Request, res: Response) => {
  try {
    const { interests, minBudget, maxBudget } = req.query;

    const query: any = {};

    if (interests) {
      const interestArray = (interests as string).split(",");
      query.interests = { $in: interestArray };
    }

    if (minBudget || maxBudget) {
      query["budgetRange.min"] = query["budgetRange.min"] || {};
      query["budgetRange.max"] = query["budgetRange.max"] || {};

      if (minBudget) {
        query["budgetRange.max"] = { $gte: parseInt(minBudget as string) };
      }
      if (maxBudget) {
        query["budgetRange.min"] = { $lte: parseInt(maxBudget as string) };
      }
    }

    const profiles = await MatchProfile.find(query).limit(20);

    res.json({
      total: profiles.length,
      profiles,
    });
  } catch (error) {
    console.error("Error searching profiles:", error);
    res.status(500).json({ error: "Failed to search profiles" });
  }
});

/**
 * PUT /api/matching/profile/:userId
 * Update match profile
 */
router.put("/profile/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const profile = await MatchProfile.findOneAndUpdate({ userId }, updates, {
      new: true,
    });

    if (!profile) {
      return res.status(404).json({ error: "Match profile not found" });
    }

    res.json({
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
