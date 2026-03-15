/**
 * Matching Routes
 * Endpoints for roommate matching functionality
 */

import express, { Request, Response } from "express";
import MatchProfile from "../models/MatchProfile";
import MatchInterest from "../models/MatchInterest";
import MatchingService from "../services/matching";

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

    const matchProfile = await MatchingService.createOrUpdateProfile(userId, {
      lifestyle,
      interests,
      budgetRange,
      bio,
    });

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

    const profile = await MatchingService.ensureProfile(userId);

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

      const profile1 = await MatchingService.ensureProfile(userId1);
      const profile2 = await MatchingService.ensureProfile(userId2);

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
    const { fromUserId, toUserId, message } = req.body;

    if (!fromUserId || !toUserId) {
      return res.status(400).json({
        error: "Missing required fields: fromUserId, toUserId",
      });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({
        error: "You cannot show interest in your own profile",
      });
    }

    await Promise.all([
      MatchingService.ensureProfile(fromUserId),
      MatchingService.ensureProfile(toUserId),
    ]);

    const interest = await MatchInterest.findOneAndUpdate(
      { fromUserId, toUserId },
      {
        fromUserId,
        toUserId,
        message: typeof message === "string" ? message.trim() : "",
        updatedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    const reverseInterest = await MatchInterest.findOne({
      fromUserId: toUserId,
      toUserId: fromUserId,
    });

    const isMutual = Boolean(reverseInterest);

    if (isMutual) {
      await MatchInterest.updateMany(
        {
          $or: [
            { fromUserId, toUserId },
            { fromUserId: toUserId, toUserId: fromUserId },
          ],
        },
        {
          $set: {
            isMutual: true,
            updatedAt: new Date(),
          },
        },
      );
    }

    res.json({
      message: isMutual
        ? "It’s a mutual match! You can start chatting now."
        : "Interest recorded successfully",
      fromUserId,
      toUserId,
      isMutual,
      interestId: interest._id,
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
 * GET /api/matching/interests/received/:userId
 * Get pending (non-mutual) interests received by a user, with sender profile info
 */
router.get(
  "/interests/received/:userId",
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const interests = await MatchInterest.find({
        toUserId: userId,
        isMutual: false,
      }).sort({ createdAt: -1 });

      const populated = await Promise.all(
        interests.map(async (interest) => {
          const profile = await MatchProfile.findOne({
            userId: interest.fromUserId,
          }).lean();
          return {
            _id: interest._id.toString(),
            fromUserId: interest.fromUserId.toString(),
            fromUserName: profile?.userName ?? "Unknown",
            fromUserBio: profile?.bio ?? "",
            fromUserInterests: profile?.interests ?? [],
            fromUserBudget: profile?.budgetRange ?? { min: 0, max: 0 },
            message: interest.message ?? "",
            isMutual: interest.isMutual,
            createdAt: interest.createdAt,
          };
        }),
      );

      res.json({ interests: populated, total: populated.length });
    } catch (error) {
      console.error("Error fetching received interests:", error);
      res.status(500).json({ error: "Failed to fetch received interests" });
    }
  },
);

/**
 * DELETE /api/matching/interests/:interestId
 * Decline / remove a received interest
 */
router.delete("/interests/:interestId", async (req: Request, res: Response) => {
  try {
    const { interestId } = req.params;
    await MatchInterest.findByIdAndDelete(interestId);
    res.json({ message: "Interest removed successfully" });
  } catch (error) {
    console.error("Error removing interest:", error);
    res.status(500).json({ error: "Failed to remove interest" });
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
