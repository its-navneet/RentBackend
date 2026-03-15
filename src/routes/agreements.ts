import express, { Request, Response } from "express";
import mongoose from "mongoose";

import { Agreement } from "../models/Agreement";
import { Property } from "../models/Property";

const router = express.Router();

const DUMMY_TERMS_AND_CONDITIONS = `Zentry Rental Agreement (Dummy Template)\n\n1. Parties\nThis agreement is between the Property Owner and the Tenant for residential use of the listed property.\n\n2. Rent and Deposit\nTenant agrees to pay monthly rent on or before the due date. Security deposit is refundable subject to deductions for damages, pending dues, or policy violations.\n\n3. Duration\nThe tenancy starts from the move-in date and remains valid for the agreed duration unless terminated earlier under this agreement.\n\n4. Usage\nThe property must be used only for lawful residential purposes. Subletting or commercial use is not permitted without written owner consent.\n\n5. Maintenance\nTenant will maintain cleanliness and report major repairs promptly. Owner remains responsible for structural repairs unless damage is tenant-caused.\n\n6. Notice and Termination\nEither party may terminate by providing written notice as per policy. Outstanding dues must be settled before move-out.\n\n7. Digital Signature\nBoth parties agree that electronic signatures are legally valid and enforceable for this agreement.`;

type AgreementResponse = {
  id: string;
  _id: mongoose.Types.ObjectId;
  propertyId: string;
  tenantId: string;
  studentId: string;
  ownerId: string;
  status: string;
  monthlyRent: number;
  depositAmount: number;
  termsAndConditions: string;
  customClauses: string[];
  moveInDate: Date;
  duration: number;
  signatureStudent?: string;
  signatureOwner?: string;
  tenantSignerName?: string;
  ownerSignerName?: string;
  tenantSignedAt?: Date;
  ownerSignedAt?: Date;
  propertyTitle: string;
  propertyAddress: string;
  propertyCity: string;
  propertyType: string;
  propertyLocation: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const toObjectIdOrNull = (value: unknown): mongoose.Types.ObjectId | null => {
  if (typeof value !== "string" || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }
  return new mongoose.Types.ObjectId(value);
};

const toAgreementResponse = async (
  agreementDoc: any,
): Promise<AgreementResponse> => {
  const property = await Property.findById(agreementDoc.propertyId)
    .select("title address city type")
    .lean();

  const propertyTitle = property?.title ?? "";
  const propertyAddress = property?.address ?? "";
  const propertyCity = property?.city ?? "";
  const propertyType = property?.type ?? "";

  return {
    id: agreementDoc._id.toString(),
    _id: agreementDoc._id,
    propertyId: agreementDoc.propertyId.toString(),
    tenantId: agreementDoc.studentId.toString(),
    studentId: agreementDoc.studentId.toString(),
    ownerId: agreementDoc.ownerId.toString(),
    status: agreementDoc.status,
    monthlyRent: agreementDoc.monthlyRent,
    depositAmount: agreementDoc.depositAmount,
    termsAndConditions:
      agreementDoc.termsAndConditions?.trim() || DUMMY_TERMS_AND_CONDITIONS,
    customClauses: agreementDoc.customClauses ?? [],
    moveInDate: agreementDoc.moveInDate,
    duration: agreementDoc.duration,
    signatureStudent: agreementDoc.signatureStudent,
    signatureOwner: agreementDoc.signatureOwner,
    tenantSignerName: agreementDoc.tenantSignerName,
    ownerSignerName: agreementDoc.ownerSignerName,
    tenantSignedAt: agreementDoc.tenantSignedAt,
    ownerSignedAt: agreementDoc.ownerSignedAt,
    propertyTitle,
    propertyAddress,
    propertyCity,
    propertyType,
    propertyLocation: [propertyAddress, propertyCity]
      .filter(Boolean)
      .join(", "),
    createdAt: agreementDoc.createdAt,
    updatedAt: agreementDoc.updatedAt,
  };
};

// GET /api/agreements/terms/template - dummy template for frontend integration
router.get("/terms/template", async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: "Zentry Rental Agreement (Dummy Template)",
      termsAndConditions: DUMMY_TERMS_AND_CONDITIONS,
      version: "v1",
    },
  });
});

// GET /api/agreements - Get agreements with optional filters
router.get("/", async (req: Request, res: Response) => {
  try {
    const tenantId =
      typeof req.query.tenantId === "string"
        ? req.query.tenantId
        : typeof req.query.studentId === "string"
          ? req.query.studentId
          : undefined;
    const ownerId =
      typeof req.query.ownerId === "string" ? req.query.ownerId : undefined;
    const propertyId =
      typeof req.query.propertyId === "string"
        ? req.query.propertyId
        : undefined;
    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;

    const query: Record<string, unknown> = {};

    if (tenantId) {
      const tenantObjectId = toObjectIdOrNull(tenantId);
      if (!tenantObjectId) {
        return res.status(400).json({
          success: false,
          error: "Invalid tenantId/studentId",
        });
      }
      query.studentId = tenantObjectId;
    }

    if (ownerId) {
      const ownerObjectId = toObjectIdOrNull(ownerId);
      if (!ownerObjectId) {
        return res.status(400).json({
          success: false,
          error: "Invalid ownerId",
        });
      }
      query.ownerId = ownerObjectId;
    }

    if (propertyId) {
      const propertyObjectId = toObjectIdOrNull(propertyId);
      if (!propertyObjectId) {
        return res.status(400).json({
          success: false,
          error: "Invalid propertyId",
        });
      }
      query.propertyId = propertyObjectId;
    }

    if (status) {
      query.status = status;
    }

    const agreements = await Agreement.find(query).sort({ createdAt: -1 });
    const responseData = await Promise.all(
      agreements.map((agreement) => toAgreementResponse(agreement)),
    );

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch agreements",
    });
  }
});

// GET /api/agreements/:id - Get agreement by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agreement = await Agreement.findById(id);

    if (!agreement) {
      return res.status(404).json({
        success: false,
        error: "Agreement not found",
      });
    }

    const responseData = await toAgreementResponse(agreement);

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch agreement",
    });
  }
});

// POST /api/agreements - Create a new agreement
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      propertyId,
      tenantId,
      studentId,
      ownerId,
      termsAndConditions,
      moveInDate,
      duration,
      depositAmount,
      monthlyRent,
      customClauses,
    } = req.body as {
      propertyId?: string;
      tenantId?: string;
      studentId?: string;
      ownerId?: string;
      termsAndConditions?: string;
      moveInDate?: string;
      duration?: number;
      depositAmount?: number;
      monthlyRent?: number;
      customClauses?: string[];
    };

    const resolvedTenantId = tenantId ?? studentId;

    if (
      !propertyId ||
      !resolvedTenantId ||
      !ownerId ||
      !moveInDate ||
      duration == null ||
      depositAmount == null ||
      monthlyRent == null
    ) {
      return res.status(400).json({
        success: false,
        error:
          "propertyId, tenantId/studentId, ownerId, moveInDate, duration, depositAmount, and monthlyRent are required",
      });
    }

    const propertyObjectId = toObjectIdOrNull(propertyId);
    const tenantObjectId = toObjectIdOrNull(resolvedTenantId);
    const ownerObjectId = toObjectIdOrNull(ownerId);

    if (!propertyObjectId || !tenantObjectId || !ownerObjectId) {
      return res.status(400).json({
        success: false,
        error:
          "propertyId, tenantId/studentId, and ownerId must be valid ObjectIds",
      });
    }

    const property = await Property.findById(propertyObjectId);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    const agreement = new Agreement({
      propertyId: propertyObjectId,
      studentId: tenantObjectId,
      ownerId: ownerObjectId,
      termsAndConditions:
        termsAndConditions?.trim() || DUMMY_TERMS_AND_CONDITIONS,
      moveInDate: new Date(moveInDate),
      duration,
      depositAmount,
      monthlyRent,
      customClauses: customClauses ?? [],
      status: "draft",
    });

    await agreement.save();

    const responseData = await toAgreementResponse(agreement);

    res.status(201).json({
      success: true,
      data: responseData,
      message: "Agreement created successfully",
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create agreement",
    });
  }
});

// PUT /api/agreements/:id - Update agreement
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      propertyId,
      tenantId,
      studentId,
      ownerId,
      termsAndConditions,
      moveInDate,
      duration,
      depositAmount,
      monthlyRent,
      customClauses,
      status,
    } = req.body as {
      propertyId?: string;
      tenantId?: string;
      studentId?: string;
      ownerId?: string;
      termsAndConditions?: string;
      moveInDate?: string;
      duration?: number;
      depositAmount?: number;
      monthlyRent?: number;
      customClauses?: string[];
      status?: string;
    };

    const existing = await Agreement.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Agreement not found",
      });
    }

    if (propertyId) {
      const objectId = toObjectIdOrNull(propertyId);
      if (!objectId) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid propertyId" });
      }
      existing.propertyId = objectId;
    }

    const resolvedTenantId = tenantId ?? studentId;
    if (resolvedTenantId) {
      const objectId = toObjectIdOrNull(resolvedTenantId);
      if (!objectId) {
        return res.status(400).json({
          success: false,
          error: "Invalid tenantId/studentId",
        });
      }
      existing.studentId = objectId;
    }

    if (ownerId) {
      const objectId = toObjectIdOrNull(ownerId);
      if (!objectId) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid ownerId" });
      }
      existing.ownerId = objectId;
    }

    if (typeof termsAndConditions === "string" && termsAndConditions.trim()) {
      existing.termsAndConditions = termsAndConditions.trim();
    }
    if (moveInDate) existing.moveInDate = new Date(moveInDate);
    if (duration != null) existing.duration = duration;
    if (depositAmount != null) existing.depositAmount = depositAmount;
    if (monthlyRent != null) existing.monthlyRent = monthlyRent;
    if (Array.isArray(customClauses)) existing.customClauses = customClauses;
    if (status) existing.status = status as typeof existing.status;

    existing.updatedAt = new Date();
    await existing.save();

    const responseData = await toAgreementResponse(existing);

    res.json({
      success: true,
      data: responseData,
      message: "Agreement updated successfully",
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update agreement",
    });
  }
});

// PUT /api/agreements/:id/sign - Sign agreement
router.put("/:id/sign", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { signedBy, signature, signerName } = req.body as {
      signedBy?: string;
      signature?: string;
      signerName?: string;
    };

    if (!signedBy || !signature) {
      return res.status(400).json({
        success: false,
        error: "signedBy and signature are required",
      });
    }

    const agreement = await Agreement.findById(id);
    if (!agreement) {
      return res.status(404).json({
        success: false,
        error: "Agreement not found",
      });
    }

    const normalizedSignedBy = signedBy.toLowerCase();

    if (normalizedSignedBy === "student" || normalizedSignedBy === "tenant") {
      agreement.signatureStudent = signature;
      agreement.tenantSignerName =
        signerName?.trim() || agreement.tenantSignerName;
      agreement.tenantSignedAt = new Date();
    } else if (normalizedSignedBy === "owner") {
      agreement.signatureOwner = signature;
      agreement.ownerSignerName =
        signerName?.trim() || agreement.ownerSignerName;
      agreement.ownerSignedAt = new Date();
    } else {
      return res.status(400).json({
        success: false,
        error: "signedBy must be tenant/student or owner",
      });
    }

    if (agreement.signatureStudent && agreement.signatureOwner) {
      agreement.status = "active";
    } else {
      agreement.status = "pending-sign";
    }

    agreement.updatedAt = new Date();
    await agreement.save();

    const responseData = await toAgreementResponse(agreement);

    res.json({
      success: true,
      data: responseData,
      message: "Agreement signed successfully",
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to sign agreement",
    });
  }
});

// DELETE /api/agreements/:id - Delete agreement
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const agreement = await Agreement.findById(id);
    if (!agreement) {
      return res.status(404).json({
        success: false,
        error: "Agreement not found",
      });
    }

    await Agreement.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Agreement deleted successfully",
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete agreement",
    });
  }
});

export default router;
