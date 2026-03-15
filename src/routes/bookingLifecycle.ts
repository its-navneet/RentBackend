/**
 * Booking Lifecycle Routes
 * Endpoints for visit requests, booking requests, and stay records
 */

import express, { Request, Response } from "express";
import VisitRequest from "../models/VisitRequest";
import BookingRequest from "../models/BookingRequest";
import StayRecord from "../models/StayRecord";
import Property from "../models/Property";
import User from "../models/User";
import LedgerService from "../services/ledger";

const router = express.Router();

// ==================== VISIT REQUEST ENDPOINTS ====================

/**
 * POST /api/booking/visit-request
 * Create a visit request
 */
router.post("/visit-request", async (req: Request, res: Response) => {
  try {
    const { tenantId, propertyId, requestedDate, notes } = req.body;

    if (!tenantId || !propertyId || !requestedDate) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const visitRequest = new VisitRequest({
      tenantId,
      propertyId,
      ownerId: property.ownerId,
      requestedDate: new Date(requestedDate),
      notes: notes || "",
      status: "pending",
    });

    await visitRequest.save();

    const populatedVisitRequest = await VisitRequest.findById(visitRequest._id)
      .populate("tenantId", "name email phone")
      .populate("ownerId", "name email phone")
      .populate("propertyId", "title address");

    res.status(201).json({
      message: "Visit request created",
      visitRequest: populatedVisitRequest ?? visitRequest,
    });
  } catch (error) {
    console.error("Error creating visit request:", error);
    res.status(500).json({ error: "Failed to create visit request" });
  }
});

/**
 * GET /api/booking/visit-requests/:ownerId
 * Get all visit requests for owner
 */
router.get("/visit-requests/:ownerId", async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;
    const status = req.query.status as string;

    const query: any = { ownerId };
    if (status) {
      query.status = status;
    }

    const visitRequests = await VisitRequest.find(query)
      .populate("tenantId", "name email phone")
      .populate("propertyId", "title address")
      .sort({ createdAt: -1 });

    res.json({
      total: visitRequests.length,
      visitRequests,
    });
  } catch (error) {
    console.error("Error fetching visit requests:", error);
    res.status(500).json({ error: "Failed to fetch visit requests" });
  }
});

/**
 * GET /api/booking/visit-requests-tenant/:tenantId
 * Get all visit requests for tenant
 */
router.get(
  "/visit-requests-tenant/:tenantId",
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const status = req.query.status as string;

      const query: any = { tenantId };
      if (status) {
        query.status = status;
      }

      const visitRequests = await VisitRequest.find(query)
        .populate("propertyId", "title address")
        .populate("ownerId", "name email phone")
        .sort({ createdAt: -1 });

      res.json({
        total: visitRequests.length,
        visitRequests,
      });
    } catch (error) {
      console.error("Error fetching tenant visit requests:", error);
      res.status(500).json({ error: "Failed to fetch visit requests" });
    }
  },
);

/**
 * PATCH /api/booking/visit-request/:visitRequestId
 * Approve or reject a visit request
 */
router.patch(
  "/visit-request/:visitRequestId",
  async (req: Request, res: Response) => {
    try {
      const { visitRequestId } = req.params;
      const { status, rejectionReason } = req.body;

      if (!status || !["approved", "rejected", "completed"].includes(status)) {
        return res.status(400).json({
          error: "Invalid status",
        });
      }

      const visitRequest = await VisitRequest.findByIdAndUpdate(
        visitRequestId,
        {
          status,
          rejectionReason: status === "rejected" ? rejectionReason : "",
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!visitRequest) {
        return res.status(404).json({ error: "Visit request not found" });
      }

      const populatedVisitRequest = await VisitRequest.findById(
        visitRequest._id,
      )
        .populate("tenantId", "name email phone")
        .populate("ownerId", "name email phone")
        .populate("propertyId", "title address");

      res.json({
        message: "Visit request updated",
        visitRequest: populatedVisitRequest ?? visitRequest,
      });
    } catch (error) {
      console.error("Error updating visit request:", error);
      res.status(500).json({ error: "Failed to update visit request" });
    }
  },
);

// ==================== BOOKING REQUEST ENDPOINTS ====================

/**
 * POST /api/booking/booking-request
 * Create a booking request
 */
router.post("/booking-request", async (req: Request, res: Response) => {
  try {
    const {
      tenantId,
      propertyId,
      visitRequestId,
      proposedCheckInDate,
      depositAmount,
      monthlyRent,
      notes,
    } = req.body;

    if (
      !tenantId ||
      !propertyId ||
      !proposedCheckInDate ||
      depositAmount === undefined ||
      monthlyRent === undefined
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const totalAmount = depositAmount + monthlyRent;

    const bookingRequest = new BookingRequest({
      tenantId,
      propertyId,
      ownerId: property.ownerId,
      visitRequestId: visitRequestId || null,
      proposedCheckInDate: new Date(proposedCheckInDate),
      depositAmount,
      monthlyRent,
      totalAmount,
      notes: notes || "",
      status: "pending",
    });

    await bookingRequest.save();

    const populatedBookingRequest = await BookingRequest.findById(
      bookingRequest._id,
    )
      .populate("tenantId", "name email phone")
      .populate("ownerId", "name email phone")
      .populate("propertyId", "title address");

    res.status(201).json({
      message: "Booking request created",
      bookingRequest: populatedBookingRequest ?? bookingRequest,
    });
  } catch (error) {
    console.error("Error creating booking request:", error);
    res.status(500).json({ error: "Failed to create booking request" });
  }
});

/**
 * GET /api/booking/booking-requests/:ownerId
 * Get all booking requests for owner
 */
router.get(
  "/booking-requests/:ownerId",
  async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.params;
      const status = req.query.status as string;

      const query: any = { ownerId };
      if (status) {
        query.status = status;
      }

      const bookingRequests = await BookingRequest.find(query)
        .populate("tenantId", "name email phone")
        .populate("propertyId", "title address")
        .sort({ createdAt: -1 });

      res.json({
        total: bookingRequests.length,
        bookingRequests,
      });
    } catch (error) {
      console.error("Error fetching booking requests:", error);
      res.status(500).json({ error: "Failed to fetch booking requests" });
    }
  },
);

/**
 * GET /api/booking/booking-requests-tenant/:tenantId
 * Get all booking requests for tenant
 */
router.get(
  "/booking-requests-tenant/:tenantId",
  async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const status = req.query.status as string;

      const query: any = { tenantId };
      if (status) {
        query.status = status;
      }

      const bookingRequests = await BookingRequest.find(query)
        .populate("propertyId", "title address")
        .populate("ownerId", "name email phone")
        .sort({ createdAt: -1 });

      res.json({
        total: bookingRequests.length,
        bookingRequests,
      });
    } catch (error) {
      console.error("Error fetching tenant booking requests:", error);
      res.status(500).json({ error: "Failed to fetch booking requests" });
    }
  },
);

/**
 * PATCH /api/booking/booking-request/:bookingRequestId
 * Approve or reject a booking request
 */
router.patch(
  "/booking-request/:bookingRequestId",
  async (req: Request, res: Response) => {
    try {
      const { bookingRequestId } = req.params;
      const { status, rejectionReason } = req.body;

      if (
        !status ||
        !["approved", "rejected", "payment_pending", "confirmed"].includes(
          status,
        )
      ) {
        return res.status(400).json({
          error: "Invalid status",
        });
      }

      const bookingRequest = await BookingRequest.findByIdAndUpdate(
        bookingRequestId,
        {
          status,
          rejectionReason: status === "rejected" ? rejectionReason : "",
          updatedAt: new Date(),
        },
        { new: true },
      );

      if (!bookingRequest) {
        return res.status(404).json({ error: "Booking request not found" });
      }

      let createdStayRecord = null;
      if (status === "confirmed") {
        const existingStay = await StayRecord.findOne({
          bookingRequestId: bookingRequest._id,
        });

        if (!existingStay) {
          createdStayRecord = new StayRecord({
            tenantId: bookingRequest.tenantId,
            ownerId: bookingRequest.ownerId,
            propertyId: bookingRequest.propertyId,
            bookingRequestId: bookingRequest._id,
            checkInDate: bookingRequest.proposedCheckInDate,
            monthlyRent: bookingRequest.monthlyRent,
            depositAmount: bookingRequest.depositAmount,
            status: "upcoming",
          });
          await createdStayRecord.save();

          const monthStart = new Date(bookingRequest.proposedCheckInDate);
          monthStart.setDate(1);
          await LedgerService.createMonthlyLedger(
            createdStayRecord._id.toString(),
            monthStart,
            bookingRequest.monthlyRent,
          );
        }
      }

      const populatedBookingRequest = await BookingRequest.findById(
        bookingRequest._id,
      )
        .populate("tenantId", "name email phone")
        .populate("ownerId", "name email phone")
        .populate("propertyId", "title address");

      res.json({
        message: "Booking request updated",
        bookingRequest: populatedBookingRequest ?? bookingRequest,
        stayRecord: createdStayRecord,
      });
    } catch (error) {
      console.error("Error updating booking request:", error);
      res.status(500).json({ error: "Failed to update booking request" });
    }
  },
);

// ==================== STAY RECORD ENDPOINTS ====================

/**
 * POST /api/booking/stay-record
 * Create a stay record (when booking is confirmed after payment)
 */
router.post("/stay-record", async (req: Request, res: Response) => {
  try {
    const {
      tenantId,
      propertyId,
      ownerId,
      bookingRequestId,
      checkInDate,
      monthlyRent,
      depositAmount,
    } = req.body;

    if (
      !tenantId ||
      !propertyId ||
      !ownerId ||
      !bookingRequestId ||
      !checkInDate
    ) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    const stayRecord = new StayRecord({
      tenantId,
      propertyId,
      ownerId,
      bookingRequestId,
      checkInDate: new Date(checkInDate),
      monthlyRent,
      depositAmount,
      status: "upcoming",
    });

    await stayRecord.save();

    // Create first month's ledger
    const monthStart = new Date(checkInDate);
    monthStart.setDate(1);
    await LedgerService.createMonthlyLedger(
      stayRecord._id.toString(),
      monthStart,
      monthlyRent,
    );

    const populatedStayRecord = await StayRecord.findById(stayRecord._id)
      .populate("tenantId", "name email phone")
      .populate("ownerId", "name email phone")
      .populate("propertyId", "title address");

    res.status(201).json({
      message: "Stay record created",
      stayRecord: populatedStayRecord ?? stayRecord,
    });
  } catch (error) {
    console.error("Error creating stay record:", error);
    res.status(500).json({ error: "Failed to create stay record" });
  }
});

/**
 * GET /api/booking/stay-records/:tenantId
 * Get all stay records for a tenant
 */
router.get("/stay-records/:tenantId", async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const status = req.query.status as string;

    const query: any = { tenantId };
    if (status) {
      query.status = status;
    }

    const stayRecords = await StayRecord.find(query)
      .populate("propertyId", "title address")
      .populate("ownerId", "name email")
      .sort({ checkInDate: -1 });

    res.json({
      total: stayRecords.length,
      stayRecords,
    });
  } catch (error) {
    console.error("Error fetching stay records:", error);
    res.status(500).json({ error: "Failed to fetch stay records" });
  }
});

/**
 * GET /api/booking/stay-records-owner/:ownerId
 * Get all stay records for an owner
 */
router.get(
  "/stay-records-owner/:ownerId",
  async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.params;
      const status = req.query.status as string;

      const query: any = { ownerId };
      if (status) {
        query.status = status;
      }

      const stayRecords = await StayRecord.find(query)
        .populate("propertyId", "title address")
        .populate("tenantId", "name email")
        .sort({ checkInDate: -1 });

      res.json({
        total: stayRecords.length,
        stayRecords,
      });
    } catch (error) {
      console.error("Error fetching owner stay records:", error);
      res.status(500).json({ error: "Failed to fetch stay records" });
    }
  },
);

/**
 * PATCH /api/booking/stay-record/:stayRecordId
 * Update stay record status
 */
router.patch(
  "/stay-record/:stayRecordId",
  async (req: Request, res: Response) => {
    try {
      const { stayRecordId } = req.params;
      const { status, checkOutDate, noticeGivenDate, cancellationReason } =
        req.body;

      if (
        !status ||
        ![
          "upcoming",
          "active",
          "notice_period",
          "completed",
          "cancelled",
        ].includes(status)
      ) {
        return res.status(400).json({
          error: "Invalid status",
        });
      }

      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (checkOutDate) updateData.checkOutDate = new Date(checkOutDate);
      if (noticeGivenDate)
        updateData.noticeGivenDate = new Date(noticeGivenDate);
      if (cancellationReason)
        updateData.cancellationReason = cancellationReason;

      const stayRecord = await StayRecord.findByIdAndUpdate(
        stayRecordId,
        updateData,
        { new: true },
      );

      if (!stayRecord) {
        return res.status(404).json({ error: "Stay record not found" });
      }

      const populatedStayRecord = await StayRecord.findById(stayRecord._id)
        .populate("tenantId", "name email phone")
        .populate("ownerId", "name email phone")
        .populate("propertyId", "title address");

      res.json({
        message: "Stay record updated",
        stayRecord: populatedStayRecord ?? stayRecord,
      });
    } catch (error) {
      console.error("Error updating stay record:", error);
      res.status(500).json({ error: "Failed to update stay record" });
    }
  },
);

/**
 * GET /api/booking/active-stays/:propertyId
 * Get all active stays for a property
 */
router.get("/active-stays/:propertyId", async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const stayRecords = await StayRecord.find({
      propertyId,
      status: "active",
    })
      .populate("tenantId", "name email phone")
      .sort({ checkInDate: 1 });

    res.json({
      total: stayRecords.length,
      stayRecords,
    });
  } catch (error) {
    console.error("Error fetching active stays:", error);
    res.status(500).json({ error: "Failed to fetch active stays" });
  }
});

export default router;
