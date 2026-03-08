import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import auth from "../services/auth";
import { User } from "../models/User";
import { Property } from "../models/Property";
import { Review } from "../models/Review";
import { VisitRequest } from "../models/VisitRequest";
import { BookingRequest } from "../models/BookingRequest";
import { StayRecord } from "../models/StayRecord";
import { Booking } from "../models/Booking";
import { Payment } from "../models/Payment";
import { TenantReliabilityScore } from "../models/TenantReliabilityScore";
import { Report } from "../models/Report";
import { Dispute } from "../models/Dispute";
import { LedgerEntry } from "../models/LedgerEntry";
import Message from "../models/Message";
import { AdminNotification } from "../models/AdminNotification";

const router = express.Router();

type AuthenticatedRequest = Request & {
  userId?: string;
  userRole?: string;
};

const toObjectId = (id: string): mongoose.Types.ObjectId | null => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return new mongoose.Types.ObjectId(id);
};

const normalizeRole = (
  role: string,
): "tenant" | "owner" | "admin" | "unknown" => {
  const value = role.toLowerCase();
  if (value === "student") return "tenant";
  if (value === "tenant" || value === "owner" || value === "admin") {
    return value;
  }
  return "unknown";
};

const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Not authenticated" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const currentUser = auth.verifyToken(token);

  if (!currentUser) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }

  req.userId = currentUser.uid;
  req.userRole = currentUser.role;
  next();
};

const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.userRole || normalizeRole(req.userRole) !== "admin") {
    res.status(403).json({
      success: false,
      error: "Admin access required",
    });
    return;
  }

  next();
};

router.use(authenticateToken);

// USER MANAGEMENT
router.get("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      role,
      verified,
      suspended,
      lowRated,
      highComplaint,
      search,
      page = "1",
      limit = "20",
    } = req.query;

    const query: Record<string, unknown> = {};

    if (role && typeof role === "string") {
      const requestedRole = normalizeRole(role);
      if (requestedRole === "tenant") {
        query.role = { $in: ["tenant", "student"] };
      } else if (requestedRole === "owner" || requestedRole === "admin") {
        query.role = requestedRole;
      }
    }

    if (verified === "true") {
      query.verified = true;
    }

    if (suspended === "true") {
      query.$or = [{ isActive: false }, { isBlocked: true }];
    }

    if (search && typeof search === "string" && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { phone: { $regex: searchRegex } },
      ];
    }

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(1, Number(limit)));

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean();

    const userIds = users.map((u) => u._id);

    const [propertyCounts, reliabilityScores, reportCounts] = await Promise.all(
      [
        Property.aggregate([
          { $match: { ownerId: { $in: userIds } } },
          { $group: { _id: "$ownerId", count: { $sum: 1 } } },
        ]),
        TenantReliabilityScore.find({ tenantId: { $in: userIds } }).lean(),
        Report.aggregate([
          {
            $match: {
              reportedUserId: { $in: userIds },
              status: { $in: ["open", "investigating"] },
            },
          },
          { $group: { _id: "$reportedUserId", count: { $sum: 1 } } },
        ]),
      ],
    );

    const propertyCountByOwner = new Map(
      propertyCounts.map((entry) => [
        entry._id.toString(),
        Number(entry.count),
      ]),
    );
    const reliabilityByTenant = new Map(
      reliabilityScores.map((entry) => [entry.tenantId.toString(), entry]),
    );
    const complaintsByUser = new Map(
      reportCounts.map((entry) => [entry._id.toString(), Number(entry.count)]),
    );

    let data = users.map((user) => {
      const tenantScore = reliabilityByTenant.get(user._id.toString());
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: normalizeRole(user.role),
        verified: user.verified,
        verificationStatus: user.verificationStatus,
        propertiesOwned: propertyCountByOwner.get(user._id.toString()) ?? 0,
        ratings: user.ratingSummary?.averageRating ?? 0,
        tenantReliabilityScore: tenantScore?.score ?? null,
        complaintCount: complaintsByUser.get(user._id.toString()) ?? 0,
        accountStatus: user.isBlocked
          ? "banned"
          : user.isActive
            ? "active"
            : "suspended",
      };
    });

    if (lowRated === "true") {
      data = data.filter((user) => user.ratings > 0 && user.ratings < 2.5);
    }

    if (highComplaint === "true") {
      data = data.filter((user) => user.complaintCount >= 3);
    }

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data,
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch users";
    res.status(500).json({ success: false, error: message });
  }
});

router.get(
  "/users/:id/profile",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = toObjectId(req.params.id);
      if (!userId) {
        res.status(400).json({ success: false, error: "Invalid user id" });
        return;
      }

      const user = await User.findById(userId).lean();
      if (!user) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }

      const [propertiesOwned, tenantScore, reviewsReceived] = await Promise.all(
        [
          Property.countDocuments({ ownerId: userId }),
          TenantReliabilityScore.findOne({ tenantId: userId }).lean(),
          Review.find({ toUserId: userId, isRemoved: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(),
        ],
      );

      res.json({
        success: true,
        data: {
          ...user,
          role: normalizeRole(user.role),
          propertiesOwned,
          tenantReliabilityScore: tenantScore,
          reviewsReceived,
          accountStatus: user.isBlocked
            ? "banned"
            : user.isActive
              ? "active"
              : "suspended",
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch user profile";
      res.status(500).json({ success: false, error: message });
    }
  },
);

router.patch(
  "/users/:id/status",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const userId = toObjectId(req.params.id);
      if (!userId) {
        res.status(400).json({ success: false, error: "Invalid user id" });
        return;
      }

      const { action } = req.body as { action?: string };
      const allowedActions = ["verify", "approve", "suspend", "ban", "reset"];

      if (!action || !allowedActions.includes(action)) {
        res.status(400).json({
          success: false,
          error:
            "Invalid action. Allowed: verify, approve, suspend, ban, reset",
        });
        return;
      }

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (action === "verify" || action === "approve") {
        updates.verified = true;
        updates.verificationStatus = "verified";
      } else if (action === "suspend") {
        updates.isActive = false;
        updates.isBlocked = false;
      } else if (action === "ban") {
        updates.isActive = false;
        updates.isBlocked = true;
      } else if (action === "reset") {
        updates.isActive = true;
        updates.isBlocked = false;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updates, {
        new: true,
      }).lean();

      if (!updatedUser) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
      }

      res.json({
        success: true,
        data: updatedUser,
        message: `User status updated with action: ${action}`,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update user status";
      res.status(500).json({ success: false, error: message });
    }
  },
);

// PROPERTY MODERATION
router.get("/properties", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, page = "1", limit = "20" } = req.query;

    const query: Record<string, unknown> = {};
    if (status && typeof status === "string") {
      query.status = status;
    }

    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(1, Number(limit)));

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate("ownerId", "name email phone verified")
      .lean();

    const total = await Property.countDocuments(query);

    res.json({
      success: true,
      data: properties,
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch properties";
    res.status(500).json({ success: false, error: message });
  }
});

router.patch(
  "/properties/:id/moderation",
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = toObjectId(req.params.id);
      const reviewerId = req.userId ? toObjectId(req.userId) : null;
      if (!propertyId || !reviewerId) {
        res.status(400).json({ success: false, error: "Invalid ids" });
        return;
      }

      const {
        status,
        reason,
      }: {
        status?: "pending_review" | "approved" | "rejected" | "suspended";
        reason?: string;
      } = req.body;

      if (
        !status ||
        !["pending_review", "approved", "rejected", "suspended"].includes(
          status,
        )
      ) {
        res.status(400).json({
          success: false,
          error:
            "Invalid status. Allowed: pending_review, approved, rejected, suspended",
        });
        return;
      }

      const updates: Record<string, unknown> = {
        status,
        moderationNotes: reason ?? "",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        verified: status === "approved",
        verificationBadge: status === "approved",
        updatedAt: new Date(),
      };

      const property = await Property.findByIdAndUpdate(propertyId, updates, {
        new: true,
      }).lean();

      if (!property) {
        res.status(404).json({ success: false, error: "Property not found" });
        return;
      }

      res.json({
        success: true,
        data: property,
        message: `Property moved to ${status}`,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update property moderation";
      res.status(500).json({ success: false, error: message });
    }
  },
);

// VISIT & BOOKING MONITORING
router.get(
  "/monitoring/bookings",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const [
        visitRequests,
        bookingRequests,
        confirmedStays,
        cancelledBookings,
      ] = await Promise.all([
        VisitRequest.find({}).sort({ createdAt: -1 }).limit(100).lean(),
        BookingRequest.find({}).sort({ createdAt: -1 }).limit(100).lean(),
        StayRecord.find({ status: "active" })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean(),
        Booking.find({ status: "cancelled" })
          .sort({ createdAt: -1 })
          .limit(100)
          .lean(),
      ]);

      const suspiciousOwners = await BookingRequest.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: "$ownerId", confirmedCount: { $sum: 1 } } },
        { $match: { confirmedCount: { $gte: 30 } } },
        { $sort: { confirmedCount: -1 } },
        { $limit: 20 },
      ]);

      res.json({
        success: true,
        data: {
          visitRequests,
          bookingRequests,
          confirmedStays,
          cancelledBookings,
          suspiciousOwners,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load booking monitoring";
      res.status(500).json({ success: false, error: message });
    }
  },
);

// DISPUTE SYSTEM
router.post("/disputes", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const raisedById = req.userId ? toObjectId(req.userId) : null;
    if (!raisedById) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const {
      againstUserId,
      propertyId,
      bookingRequestId,
      stayRecordId,
      ledgerEntryId,
      category,
      title,
      description,
      evidence,
    } = req.body as {
      againstUserId?: string;
      propertyId?: string;
      bookingRequestId?: string;
      stayRecordId?: string;
      ledgerEntryId?: string;
      category?: string;
      title?: string;
      description?: string;
      evidence?: string[];
    };

    if (!category || !title || !description) {
      res.status(400).json({
        success: false,
        error: "category, title and description are required",
      });
      return;
    }

    const dispute = await Dispute.create({
      raisedByUserId: raisedById,
      againstUserId: againstUserId ? toObjectId(againstUserId) : null,
      propertyId: propertyId ? toObjectId(propertyId) : null,
      bookingRequestId: bookingRequestId ? toObjectId(bookingRequestId) : null,
      stayRecordId: stayRecordId ? toObjectId(stayRecordId) : null,
      ledgerEntryId: ledgerEntryId ? toObjectId(ledgerEntryId) : null,
      category,
      title,
      description,
      evidence: evidence ?? [],
      status: "open",
      adminAction: "none",
    });

    res.status(201).json({
      success: true,
      data: dispute,
      message: "Dispute submitted successfully",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to submit dispute";
    res.status(500).json({ success: false, error: message });
  }
});

router.get("/disputes", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query: Record<string, unknown> = {};

    if (status && typeof status === "string") {
      query.status = status;
    }

    const disputes = await Dispute.find(query)
      .sort({ createdAt: -1 })
      .populate("raisedByUserId", "name email phone role")
      .populate("againstUserId", "name email phone role")
      .lean();

    res.json({ success: true, data: disputes });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch disputes";
    res.status(500).json({ success: false, error: message });
  }
});

router.get(
  "/disputes/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const disputeId = toObjectId(req.params.id);
      if (!disputeId) {
        res.status(400).json({ success: false, error: "Invalid dispute id" });
        return;
      }

      const dispute = await Dispute.findById(disputeId)
        .populate("raisedByUserId", "name email phone role")
        .populate("againstUserId", "name email phone role")
        .lean();

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      const userIds: mongoose.Types.ObjectId[] = [];
      if (dispute.raisedByUserId && "_id" in dispute.raisedByUserId) {
        userIds.push(dispute.raisedByUserId._id as mongoose.Types.ObjectId);
      }
      if (dispute.againstUserId && "_id" in dispute.againstUserId) {
        userIds.push(dispute.againstUserId._id as mongoose.Types.ObjectId);
      }

      const [chatHistory, ledgerRecords, bookingHistory] = await Promise.all([
        userIds.length === 2
          ? Message.find({
              $or: [
                { senderId: userIds[0], receiverId: userIds[1] },
                { senderId: userIds[1], receiverId: userIds[0] },
              ],
            })
              .sort({ createdAt: -1 })
              .limit(100)
              .lean()
          : Promise.resolve([]),
        dispute.ledgerEntryId
          ? LedgerEntry.find({ _id: dispute.ledgerEntryId }).lean()
          : Promise.resolve([]),
        dispute.bookingRequestId
          ? BookingRequest.find({ _id: dispute.bookingRequestId }).lean()
          : Promise.resolve([]),
      ]);

      res.json({
        success: true,
        data: {
          dispute,
          chatHistory,
          ledgerRecords,
          bookingHistory,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch dispute details";
      res.status(500).json({ success: false, error: message });
    }
  },
);

router.patch(
  "/disputes/:id/status",
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const disputeId = toObjectId(req.params.id);
      const adminId = req.userId ? toObjectId(req.userId) : null;

      if (!disputeId || !adminId) {
        res.status(400).json({ success: false, error: "Invalid ids" });
        return;
      }

      const {
        status,
        adminAction,
        resolutionNotes,
      }: {
        status?: "open" | "under_review" | "resolved" | "rejected";
        adminAction?:
          | "none"
          | "warn_user"
          | "refund_deposit"
          | "penalize_owner"
          | "ban_tenant";
        resolutionNotes?: string;
      } = req.body;

      if (
        !status ||
        !["open", "under_review", "resolved", "rejected"].includes(status)
      ) {
        res.status(400).json({
          success: false,
          error: "Invalid status",
        });
        return;
      }

      const updates: Record<string, unknown> = {
        status,
        adminAction: adminAction ?? "none",
        resolutionNotes: resolutionNotes ?? "",
        resolvedBy: adminId,
        updatedAt: new Date(),
      };

      if (status === "resolved" || status === "rejected") {
        updates.resolvedAt = new Date();
      }

      const dispute = await Dispute.findByIdAndUpdate(disputeId, updates, {
        new: true,
      }).lean();

      if (!dispute) {
        res.status(404).json({ success: false, error: "Dispute not found" });
        return;
      }

      res.json({ success: true, data: dispute });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update dispute";
      res.status(500).json({ success: false, error: message });
    }
  },
);

// REVIEW MODERATION
router.get("/reviews", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { flaggedOnly } = req.query;

    const query: Record<string, unknown> = {};
    if (flaggedOnly === "true") {
      query.isFlagged = true;
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("fromUserId", "name email")
      .populate("toUserId", "name email")
      .lean();

    const suspiciousRatingPatterns = await Review.aggregate([
      {
        $group: {
          _id: "$fromUserId",
          count: { $sum: 1 },
          avgRating: { $avg: "$overallRating" },
        },
      },
      {
        $match: {
          count: { $gte: 8 },
          avgRating: { $gte: 4.8 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 20,
      },
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        suspiciousRatingPatterns,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch reviews";
    res.status(500).json({ success: false, error: message });
  }
});

router.patch(
  "/reviews/:id/flag",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const reviewId = toObjectId(req.params.id);
      if (!reviewId) {
        res.status(400).json({ success: false, error: "Invalid review id" });
        return;
      }

      const { reason } = req.body as { reason?: string };
      const review = await Review.findByIdAndUpdate(
        reviewId,
        {
          isFlagged: true,
          flagReason: reason ?? "Flagged by admin",
          updatedAt: new Date(),
        },
        { new: true },
      ).lean();

      if (!review) {
        res.status(404).json({ success: false, error: "Review not found" });
        return;
      }

      res.json({ success: true, data: review, message: "Review flagged" });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to flag review";
      res.status(500).json({ success: false, error: message });
    }
  },
);

router.patch(
  "/reviews/:id/remove",
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reviewId = toObjectId(req.params.id);
      const adminId = req.userId ? toObjectId(req.userId) : null;
      if (!reviewId || !adminId) {
        res.status(400).json({ success: false, error: "Invalid ids" });
        return;
      }

      const review = await Review.findByIdAndUpdate(
        reviewId,
        {
          isRemoved: true,
          removedBy: adminId,
          removedAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true },
      ).lean();

      if (!review) {
        res.status(404).json({ success: false, error: "Review not found" });
        return;
      }

      res.json({ success: true, data: review, message: "Review removed" });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to remove review";
      res.status(500).json({ success: false, error: message });
    }
  },
);

// REVENUE DASHBOARD
router.get(
  "/dashboard/revenue",
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalRevenueResult,
        monthlyRevenueResult,
        paymentsByType,
        dailyBookings,
        activeSubscriptions,
      ] = await Promise.all([
        Payment.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.aggregate([
          {
            $match: {
              status: "completed",
              createdAt: { $gte: monthStart },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: "$type", total: { $sum: "$amount" } } },
        ]),
        BookingRequest.aggregate([
          {
            $group: {
              _id: {
                y: { $year: "$createdAt" },
                m: { $month: "$createdAt" },
                d: { $dayOfMonth: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
          { $limit: 60 },
        ]),
        User.countDocuments({ role: "owner", isActive: true }),
      ]);

      res.json({
        success: true,
        data: {
          totalRevenue: totalRevenueResult[0]?.total ?? 0,
          monthlyRevenue: monthlyRevenueResult[0]?.total ?? 0,
          bookingsRevenue:
            (paymentsByType.find((p) => p._id === "rent")?.total as
              | number
              | undefined) ?? 0,
          activeSubscriptions,
          paymentsByType,
          dailyBookings,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch revenue dashboard";
      res.status(500).json({ success: false, error: message });
    }
  },
);

// PLATFORM ANALYTICS
router.get(
  "/dashboard/analytics",
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const [
        totalUsers,
        activeTenants,
        activeOwners,
        totalProperties,
        totalBookings,
        activeStays,
        cityBreakdown,
        popularPgs,
        avgRent,
        monthlyGrowth,
      ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({
          role: { $in: ["tenant", "student"] },
          isActive: true,
        }),
        User.countDocuments({ role: "owner", isActive: true }),
        Property.countDocuments({}),
        BookingRequest.countDocuments({}),
        StayRecord.countDocuments({ status: "active" }),
        Property.aggregate([
          { $group: { _id: "$city", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
        Property.aggregate([
          {
            $project: {
              title: 1,
              city: 1,
              reviewCount: { $size: { $ifNull: ["$reviews", []] } },
            },
          },
          { $sort: { reviewCount: -1 } },
          { $limit: 10 },
        ]),
        Property.aggregate([
          { $project: { avg: { $avg: ["$budget.min", "$budget.max"] } } },
          { $group: { _id: null, avgRent: { $avg: "$avg" } } },
        ]),
        BookingRequest.aggregate([
          {
            $group: {
              _id: {
                y: { $year: "$createdAt" },
                m: { $month: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.y": 1, "_id.m": 1 } },
          { $limit: 24 },
        ]),
      ]);

      const occupancyRate =
        totalProperties > 0 ? (activeStays / totalProperties) * 100 : 0;

      res.json({
        success: true,
        data: {
          totalUsers,
          activeTenants,
          activeOwners,
          totalProperties,
          totalBookings,
          occupancyRate: Number(occupancyRate.toFixed(2)),
          topCities: cityBreakdown,
          mostPopularPgs: popularPgs,
          averageRentPrice: Number((avgRent[0]?.avgRent ?? 0).toFixed(2)),
          monthlyGrowth,
        },
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch analytics dashboard";
      res.status(500).json({ success: false, error: message });
    }
  },
);

// COMPLAINT & REPORT SYSTEM
router.post("/reports", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reporterId = req.userId ? toObjectId(req.userId) : null;
    if (!reporterId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const {
      reportedUserId,
      propertyId,
      reason,
      details,
      evidence,
    }: {
      reportedUserId?: string;
      propertyId?: string;
      reason?: string;
      details?: string;
      evidence?: string[];
    } = req.body;

    if (!reason) {
      res.status(400).json({ success: false, error: "reason is required" });
      return;
    }

    const report = await Report.create({
      reporterUserId: reporterId,
      reportedUserId: reportedUserId ? toObjectId(reportedUserId) : null,
      propertyId: propertyId ? toObjectId(propertyId) : null,
      reason,
      details: details ?? "",
      evidence: evidence ?? [],
      status: "open",
      actionTaken: "none",
    });

    res.status(201).json({
      success: true,
      data: report,
      message: "Report submitted successfully",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to submit report";
    res.status(500).json({ success: false, error: message });
  }
});

router.get("/reports", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const query: Record<string, unknown> = {};
    if (status && typeof status === "string") {
      query.status = status;
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .populate("reporterUserId", "name email phone")
      .populate("reportedUserId", "name email phone")
      .populate("propertyId", "title city address")
      .lean();

    res.json({ success: true, data: reports });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch reports";
    res.status(500).json({ success: false, error: message });
  }
});

router.patch(
  "/reports/:id/action",
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reportId = toObjectId(req.params.id);
      const adminId = req.userId ? toObjectId(req.userId) : null;

      if (!reportId || !adminId) {
        res.status(400).json({ success: false, error: "Invalid ids" });
        return;
      }

      const {
        status,
        actionTaken,
        adminNotes,
      }: {
        status?: "open" | "investigating" | "action_taken" | "dismissed";
        actionTaken?:
          | "none"
          | "warn_user"
          | "suspend_account"
          | "remove_listing";
        adminNotes?: string;
      } = req.body;

      if (
        !status ||
        !["open", "investigating", "action_taken", "dismissed"].includes(status)
      ) {
        res
          .status(400)
          .json({ success: false, error: "Invalid report status" });
        return;
      }

      const report = await Report.findByIdAndUpdate(
        reportId,
        {
          status,
          actionTaken: actionTaken ?? "none",
          adminNotes: adminNotes ?? "",
          handledBy: adminId,
          handledAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true },
      ).lean();

      if (!report) {
        res.status(404).json({ success: false, error: "Report not found" });
        return;
      }

      if (actionTaken === "suspend_account" && report.reportedUserId) {
        await User.findByIdAndUpdate(report.reportedUserId, {
          isActive: false,
          isBlocked: false,
          updatedAt: new Date(),
        });
      }

      if (actionTaken === "remove_listing" && report.propertyId) {
        await Property.findByIdAndUpdate(report.propertyId, {
          status: "suspended",
          moderationNotes: "Suspended due to user report",
          updatedAt: new Date(),
        });
      }

      res.json({ success: true, data: report });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update report";
      res.status(500).json({ success: false, error: message });
    }
  },
);

// NOTIFICATIONS
router.post(
  "/notifications",
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const senderId = req.userId ? toObjectId(req.userId) : null;
      if (!senderId) {
        res.status(400).json({ success: false, error: "Invalid sender id" });
        return;
      }

      const {
        title,
        message,
        channels,
        targetRole,
      }: {
        title?: string;
        message?: string;
        channels?: Array<"push" | "email" | "in_app">;
        targetRole?: "all" | "tenant" | "owner";
      } = req.body;

      if (!title || !message) {
        res
          .status(400)
          .json({ success: false, error: "title and message are required" });
        return;
      }

      const notification = await AdminNotification.create({
        title,
        message,
        channels: channels && channels.length > 0 ? channels : ["in_app"],
        targetRole: targetRole ?? "all",
        sentBy: senderId,
      });

      res.status(201).json({
        success: true,
        data: notification,
        message: "Notification broadcast queued",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create notification";
      res.status(500).json({ success: false, error: message });
    }
  },
);

router.get(
  "/notifications",
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const notifications = await AdminNotification.find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("sentBy", "name email")
        .lean();

      res.json({ success: true, data: notifications });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch notifications";
      res.status(500).json({ success: false, error: message });
    }
  },
);

// VERIFICATION SYSTEM
router.patch(
  "/verification/owner/:id",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const ownerId = toObjectId(req.params.id);
      if (!ownerId) {
        res.status(400).json({ success: false, error: "Invalid owner id" });
        return;
      }

      const {
        verificationStatus,
        phoneVerified,
        idVerified,
        businessVerified,
      }: {
        verificationStatus?: "pending" | "verified" | "rejected" | "on_review";
        phoneVerified?: boolean;
        idVerified?: boolean;
        businessVerified?: boolean;
      } = req.body;

      if (!verificationStatus) {
        res.status(400).json({
          success: false,
          error: "verificationStatus is required",
        });
        return;
      }

      const owner = await User.findByIdAndUpdate(
        ownerId,
        {
          verificationStatus,
          verified: verificationStatus === "verified",
          backgroundCheckStatus:
            verificationStatus === "verified" ? "approved" : "pending",
          verificationMeta: {
            phoneVerified: phoneVerified ?? false,
            idVerified: idVerified ?? false,
            businessVerified: businessVerified ?? false,
            badge:
              verificationStatus === "verified" ? "verified_owner" : "none",
          },
          updatedAt: new Date(),
        },
        { new: true },
      ).lean();

      if (!owner) {
        res.status(404).json({ success: false, error: "Owner not found" });
        return;
      }

      res.json({
        success: true,
        data: owner,
        message: "Owner verification updated",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to verify owner";
      res.status(500).json({ success: false, error: message });
    }
  },
);

router.patch(
  "/verification/property/:id",
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyId = toObjectId(req.params.id);
      const adminId = req.userId ? toObjectId(req.userId) : null;
      if (!propertyId || !adminId) {
        res.status(400).json({ success: false, error: "Invalid ids" });
        return;
      }

      const { isVerified }: { isVerified?: boolean } = req.body;
      if (typeof isVerified !== "boolean") {
        res
          .status(400)
          .json({ success: false, error: "isVerified must be boolean" });
        return;
      }

      const property = await Property.findByIdAndUpdate(
        propertyId,
        {
          verified: isVerified,
          verificationBadge: isVerified,
          status: isVerified ? "approved" : "pending_review",
          reviewedBy: adminId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true },
      ).lean();

      if (!property) {
        res.status(404).json({ success: false, error: "Property not found" });
        return;
      }

      res.json({
        success: true,
        data: property,
        message: "Property verification updated",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to verify property";
      res.status(500).json({ success: false, error: message });
    }
  },
);

export default router;
