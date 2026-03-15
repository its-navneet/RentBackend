import express, { Request, Response } from "express";
import { Booking } from "../models/Booking";
import { Property } from "../models/Property";
import { User } from "../models/User";
import mongoose from "mongoose";

const router = express.Router();

const toObjectIdOrNull = (value?: string): mongoose.Types.ObjectId | null => {
  if (!value) return null;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const enrichBooking = async (booking: any) => {
  const property = booking.propertyId
    ? await Property.findById(booking.propertyId).select("title address city")
    : null;

  const tenant = booking.studentId
    ? await User.findById(booking.studentId).select("name email")
    : null;

  return {
    id: booking._id.toString(),
    _id: booking._id,
    propertyId: booking.propertyId?.toString?.() ?? "",
    tenantId: booking.studentId?.toString?.() ?? "",
    studentId: booking.studentId?.toString?.() ?? "",
    ownerResponse: booking.ownerResponse,
    visitDate: booking.visitDate,
    visitNote: booking.visitNote ?? "",
    status: booking.status,
    createdAt: booking.createdAt,
    propertyTitle: property?.title ?? "",
    propertyLocation: [property?.address ?? "", property?.city ?? ""]
      .filter(Boolean)
      .join(", "),
    tenantName: tenant?.name ?? "",
    tenantEmail: tenant?.email ?? "",
  };
};

// GET /api/bookings - Get all bookings
router.get("/", async (req: Request, res: Response) => {
  try {
    const { studentId, tenantId, ownerId, propertyId, status } = req.query as {
      studentId?: string;
      tenantId?: string;
      ownerId?: string;
      propertyId?: string;
      status?: string;
    };

    const query: any = {};

    const tenantObjectId = toObjectIdOrNull(studentId ?? tenantId);
    if ((studentId || tenantId) && !tenantObjectId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid tenantId/studentId" });
    }
    if (tenantObjectId) query.studentId = tenantObjectId;

    const propertyObjectId = toObjectIdOrNull(propertyId);
    if (propertyId && !propertyObjectId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid propertyId" });
    }
    if (propertyObjectId) query.propertyId = propertyObjectId;

    if (status) query.status = status;

    if (ownerId) {
      const ownerObjectId = toObjectIdOrNull(ownerId);
      if (!ownerObjectId) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid ownerId" });
      }

      const ownerProperties = await Property.find({ ownerId: ownerObjectId })
        .select("_id")
        .lean();
      const ownerPropertyIds = ownerProperties.map((p: any) => p._id);
      query.propertyId = { $in: ownerPropertyIds };
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    const enrichedBookings = await Promise.all(bookings.map(enrichBooking));

    res.json({
      success: true,
      data: enrichedBookings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch bookings",
    });
  }
});

// GET /api/bookings/:id - Get booking by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid booking id" });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    const data = await enrichBooking(booking);

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch booking",
    });
  }
});

// POST /api/bookings - Create a new booking
router.post("/", async (req: Request, res: Response) => {
  try {
    const { propertyId, studentId, tenantId, visitDate, visitNote, comment } =
      req.body as {
        propertyId?: string;
        studentId?: string;
        tenantId?: string;
        visitDate?: string;
        visitNote?: string;
        comment?: string;
      };

    const finalStudentId = studentId ?? tenantId;

    if (!propertyId || !finalStudentId || !visitDate) {
      return res.status(400).json({
        success: false,
        error: "propertyId, studentId/tenantId, and visitDate are required",
      });
    }

    const propertyObjectId = toObjectIdOrNull(propertyId);
    const studentObjectId = toObjectIdOrNull(finalStudentId);

    if (!propertyObjectId || !studentObjectId) {
      return res.status(400).json({
        success: false,
        error: "Invalid propertyId or studentId",
      });
    }

    const property = await Property.findById(propertyObjectId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    const booking = new Booking({
      propertyId: propertyObjectId,
      studentId: studentObjectId,
      ownerResponse: "pending",
      visitDate: new Date(visitDate),
      visitNote: (visitNote ?? comment ?? "").toString().trim(),
      status: "pending",
    });

    await booking.save();

    const data = await enrichBooking(booking);

    res.status(201).json({
      success: true,
      data,
      message: "Booking created successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create booking",
    });
  }
});

// PUT /api/bookings/:id - Update booking (owner response)
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ownerResponse, status, visitDate, visitNote } = req.body as {
      ownerResponse?: string;
      status?: string;
      visitDate?: string;
      visitNote?: string;
    };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid booking id" });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    if (ownerResponse) booking.ownerResponse = ownerResponse as any;
    if (status) booking.status = status as any;
    if (visitDate) booking.visitDate = new Date(visitDate);
    if (typeof visitNote === "string") booking.visitNote = visitNote;

    await booking.save();

    const data = await enrichBooking(booking);

    res.json({
      success: true,
      data,
      message: "Booking updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update booking",
    });
  }
});

// DELETE /api/bookings/:id - Cancel/delete booking
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid booking id" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found",
      });
    }

    await Booking.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to cancel booking",
    });
  }
});

export default router;
