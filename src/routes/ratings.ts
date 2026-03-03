/**
 * Rating & Reliability Routes
 * Endpoints for multi-directional ratings and tenant reliability scores
 */

import express, { Request, Response } from "express";
import Review from "../models/Review";
import StayRecord from "../models/StayRecord";
import TenantReliabilityScore from "../models/TenantReliabilityScore";
import ReliabilityScoreService from "../services/reliabilityScore";

const router = express.Router();

// ==================== RATING ENDPOINTS ====================

/**
 * POST /api/ratings/submit
 * Submit a rating (owner to tenant, tenant to owner, or tenant to property)
 */
router.post("/submit", async (req: Request, res: Response) => {
  try {
    const {
      ratingType,
      stayRecordId,
      fromUserId,
      toUserId,
      propertyId,
      overallRating,
      criteria,
      comment,
      isAnonymous,
    } = req.body;

    // Validate input
    if (
      !["owner_to_tenant", "tenant_to_owner", "tenant_to_property"].includes(
        ratingType,
      )
    ) {
      return res.status(400).json({ error: "Invalid rating type" });
    }

    // For owner_to_tenant and tenant_to_owner, stayRecordId is required
    if (
      (ratingType === "owner_to_tenant" || ratingType === "tenant_to_owner") &&
      !stayRecordId
    ) {
      return res.status(400).json({
        error: "stayRecordId is required for this rating type",
      });
    }

    // Verify stay record exists and is valid for rating
    if (stayRecordId) {
      const stayRecord = await StayRecord.findById(stayRecordId);
      if (!stayRecord) {
        return res.status(404).json({ error: "Stay record not found" });
      }

      // Rating only allowed if stay record exists (completed or active)
      if (
        !["active", "notice_period", "completed"].includes(stayRecord.status)
      ) {
        return res.status(400).json({
          error: "Rating not allowed for this stay status",
        });
      }
    }

    // Check if rating already exists
    const existingRating = await Review.findOne({
      ratingType,
      stayRecordId: stayRecordId || null,
      fromUserId,
      toUserId: toUserId || null,
      propertyId: propertyId || null,
    });

    if (existingRating && existingRating.isLocked) {
      return res.status(400).json({
        error: "Rating already submitted and locked",
      });
    }

    // Build rating object based on type
    let ratingData: any = {
      ratingType,
      fromUserId,
      overallRating,
      comment: comment || "",
      isAnonymous: isAnonymous || false,
      isLocked: true,
    };

    if (stayRecordId) {
      ratingData.stayRecordId = stayRecordId;
    }

    if (ratingType !== "tenant_to_property") {
      ratingData.toUserId = toUserId;
    }

    if (ratingType === "owner_to_tenant") {
      ratingData.tenantCriteria = criteria;
    } else if (ratingType === "tenant_to_owner") {
      ratingData.ownerCriteria = criteria;
    } else if (ratingType === "tenant_to_property") {
      ratingData.propertyId = propertyId;
      ratingData.propertyCriteria = criteria;
    }

    // Update or create rating
    const rating = await Review.findOneAndUpdate(
      {
        ratingType,
        stayRecordId: stayRecordId || null,
        fromUserId,
        toUserId: toUserId || null,
        propertyId: propertyId || null,
      },
      ratingData,
      { upsert: true, new: true },
    );

    // Update tenant reliability score if owner rated tenant
    if (ratingType === "owner_to_tenant") {
      await ReliabilityScoreService.updateReliabilityScore(toUserId);
    }

    res.status(201).json({
      message: "Rating submitted successfully",
      rating,
    });
  } catch (error: any) {
    console.error("Error submitting rating:", error);
    res.status(500).json({
      error: error.message || "Failed to submit rating",
    });
  }
});

/**
 * GET /api/ratings/stay/:stayRecordId
 * Get all ratings for a stay record
 */
router.get("/stay/:stayRecordId", async (req: Request, res: Response) => {
  try {
    const { stayRecordId } = req.params;

    const ratings = await Review.find({ stayRecordId }).populate(
      "fromUserId",
      "name email",
    );

    res.json({
      total: ratings.length,
      ratings,
    });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

/**
 * GET /api/ratings/received/:userId
 * Get all ratings received by a user
 */
router.get("/received/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const ratingType = req.query.ratingType as string;

    const query: any = { toUserId: userId };
    if (ratingType) {
      query.ratingType = ratingType;
    }

    const ratings = await Review.find(query)
      .populate("fromUserId", "name email")
      .populate("stayRecordId")
      .sort({ createdAt: -1 });

    res.json({
      total: ratings.length,
      ratings,
    });
  } catch (error) {
    console.error("Error fetching received ratings:", error);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

/**
 * GET /api/ratings/given/:userId
 * Get all ratings given by a user
 */
router.get("/given/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const ratingType = req.query.ratingType as string;

    const query: any = { fromUserId: userId };
    if (ratingType) {
      query.ratingType = ratingType;
    }

    const ratings = await Review.find(query)
      .populate("toUserId", "name email")
      .populate("propertyId", "title address")
      .sort({ createdAt: -1 });

    res.json({
      total: ratings.length,
      ratings,
    });
  } catch (error) {
    console.error("Error fetching given ratings:", error);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

/**
 * GET /api/ratings/property/:propertyId
 * Get all ratings for a property
 */
router.get("/property/:propertyId", async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const ratings = await Review.find({
      propertyId,
      ratingType: "tenant_to_property",
    })
      .populate("fromUserId", "name")
      .sort({ createdAt: -1 });

    // Calculate average property rating
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length
        : 0;

    res.json({
      total: ratings.length,
      averageRating: parseFloat(averageRating.toFixed(2)),
      ratings,
    });
  } catch (error) {
    console.error("Error fetching property ratings:", error);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});

/**
 * GET /api/ratings/check-eligibility/:stayRecordId/:userId
 * Check if user is eligible to rate
 */
router.get(
  "/check-eligibility/:stayRecordId/:userId",
  async (req: Request, res: Response) => {
    try {
      const { stayRecordId, userId } = req.params;

      const stayRecord = await StayRecord.findById(stayRecordId);
      if (!stayRecord) {
        return res.status(404).json({ error: "Stay record not found" });
      }

      // Check if user is part of the stay
      const isPartOfStay =
        stayRecord.tenantId.toString() === userId ||
        stayRecord.ownerId.toString() === userId;

      if (!isPartOfStay) {
        return res.status(403).json({
          eligible: false,
          reason: "User is not part of this stay",
        });
      }

      // Check if stay is in valid status for rating
      const canRate = ["active", "notice_period", "completed"].includes(
        stayRecord.status,
      );

      if (!canRate) {
        return res.status(400).json({
          eligible: false,
          reason: `Cannot rate - stay status is ${stayRecord.status}`,
        });
      }

      res.json({
        eligible: true,
        message: "User is eligible to submit rating",
      });
    } catch (error) {
      console.error("Error checking rating eligibility:", error);
      res.status(500).json({ error: "Failed to check eligibility" });
    }
  },
);

// ==================== RELIABILITY SCORE ENDPOINTS ====================

/**
 * GET /api/ratings/reliability-score/:tenantId
 * Get tenant reliability score and badge
 */
router.get(
  "/reliability-score/:tenantId",
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;

      const score = await ReliabilityScoreService.getReliabilityScore(tenantId);

      if (!score) {
        return res.status(404).json({ error: "Reliability score not found" });
      }

      res.json(score);
    } catch (error) {
      console.error("Error fetching reliability score:", error);
      res.status(500).json({ error: "Failed to fetch reliability score" });
    }
  },
);

/**
 * GET /api/ratings/reliability-badge/:tenantId
 * Get only the reliability badge for a tenant
 */
router.get(
  "/reliability-badge/:tenantId",
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;

      const score = await ReliabilityScoreService.getReliabilityScore(tenantId);

      if (!score) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      res.json({
        badge: score.badge,
        score: score.score,
        description:
          score.badge === "trusted_tenant"
            ? "This tenant has a proven track record of reliable payments and positive behavior"
            : score.badge === "good_tenant"
              ? "This tenant has maintained good payment history"
              : "This tenant is new or needs verification",
      });
    } catch (error) {
      console.error("Error fetching reliability badge:", error);
      res.status(500).json({ error: "Failed to fetch badge" });
    }
  },
);

/**
 * POST /api/ratings/update-reliability/:tenantId
 * Manually trigger reliability score update
 */
router.post(
  "/update-reliability/:tenantId",
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;

      await ReliabilityScoreService.updateReliabilityScore(tenantId);
      const score = await ReliabilityScoreService.getReliabilityScore(tenantId);

      res.json({
        message: "Reliability score updated",
        score,
      });
    } catch (error) {
      console.error("Error updating reliability score:", error);
      res.status(500).json({ error: "Failed to update reliability score" });
    }
  },
);

export default router;
