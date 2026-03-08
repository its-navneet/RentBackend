import express, { Request, Response } from "express";
import { Property, IProperty } from "../models/Property";
import { OwnerProfile } from "../models/OwnerProfile";
import mongoose from "mongoose";
import { generateReadPresignedUrl } from "../services/upload";
import auth from "../services/auth";

const router = express.Router();

// Authentication middleware
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Not authenticated",
    });
  }

  const token = authHeader.split(" ")[1];
  const currentUser = auth.verifyToken(token);

  if (!currentUser) {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }

  (req as any).userId = currentUser.uid;
  next();
};

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const resolveReadUrl = async (value: string): Promise<string> => {
  if (!value || isHttpUrl(value)) {
    return value;
  }

  try {
    return await generateReadPresignedUrl(value);
  } catch {
    // Fallback to raw value so one failed key does not break full property response
    return value;
  }
};

// Helper function to convert S3 keys to presigned URLs
async function convertKeysToUrls(property: any): Promise<any> {
  const propertyObj = property.toObject ? property.toObject() : property;

  // Convert photos array (S3 keys to presigned URLs)
  if (Array.isArray(propertyObj.photos) && propertyObj.photos.length > 0) {
    propertyObj.photos = await Promise.all(
      propertyObj.photos.map((key: string) => resolveReadUrl(key)),
    );
  }

  // Convert categorizedImages object (keys to presigned URLs)
  if (
    propertyObj.categorizedImages &&
    typeof propertyObj.categorizedImages === "object"
  ) {
    const categorizedUrls: any = {};
    for (const [category, keys] of Object.entries(
      propertyObj.categorizedImages,
    )) {
      if (Array.isArray(keys)) {
        categorizedUrls[category] = await Promise.all(
          keys.map((key: string) => resolveReadUrl(key as string)),
        );
      } else {
        categorizedUrls[category] = keys;
      }
    }
    propertyObj.categorizedImages = categorizedUrls;
  }

  return propertyObj;
}

// GET /api/properties - Get all properties
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      city,
      type,
      minBudget,
      maxBudget,
      bedrooms,
      amenities,
      verified,
      ownerVerified,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build MongoDB query
    const query: any = {};
    if (city) {
      query.city = { $regex: city, $options: "i" };
    }
    if (type) {
      query.type = type;
    }
    if (minBudget || maxBudget) {
      query.$and = query.$and || [];
      if (minBudget)
        query.$and.push({ "budget.min": { $gte: Number(minBudget) } });
      if (maxBudget)
        query.$and.push({ "budget.max": { $lte: Number(maxBudget) } });
    }
    if (bedrooms) {
      query.bedrooms = { $gte: Number(bedrooms) };
    }
    if (amenities) {
      const amenityList = (amenities as string).split(",").map((a) => a.trim());
      query.amenities = { $all: amenityList };
    }
    if (verified !== undefined) {
      query.verified = verified === "true";
    }
    if (ownerVerified !== undefined) {
      query.ownerVerified = ownerVerified === "true";
    }

    // Fetch from MongoDB
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const sortField = sortBy as string;
    const sortDirection = sortOrder === "desc" ? -1 : 1;

    const properties = await Property.find(query)
      .sort({ [sortField]: sortDirection })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // Convert S3 keys to presigned URLs
    const propertiesWithUrls = await Promise.all(
      properties.map((prop) => convertKeysToUrls(prop)),
    );

    const total = await Property.countDocuments(query);

    res.json({
      success: true,
      data: propertiesWithUrls,
      total: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch properties",
    });
  }
});

// GET /api/properties/my-listings - Get current owner's properties (requires authentication)
router.get(
  "/my-listings",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId;

      const properties = await Property.find({
        ownerId: new mongoose.Types.ObjectId(userId),
      }).sort({ createdAt: -1 }); // Most recent first

      // Convert S3 keys to presigned URLs
      const propertiesWithUrls = await Promise.all(
        properties.map((prop) => convertKeysToUrls(prop)),
      );

      res.json({
        success: true,
        data: propertiesWithUrls,
        total: propertiesWithUrls.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch your listings",
      });
    }
  },
);

// GET /api/properties/:id - Get property by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    // Convert S3 keys to presigned URLs
    const propertyWithUrls = await convertKeysToUrls(property);

    const responseJson = {
      success: true,
      data: propertyWithUrls,
    };

    console.log("=== Property Details Response ===");
    console.log(JSON.stringify(responseJson, null, 2));

    res.json(responseJson);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch property",
    });
  }
});

// POST /api/properties - Create a new property
router.post("/", async (req: Request, res: Response) => {
  try {
    const propertyData = req.body;

    console.log("=== Creating Property ===");
    console.log("Photos:", propertyData.photos);
    console.log("Categorized Images:", propertyData.categorizedImages);

    if (!propertyData.ownerId || !propertyData.title || !propertyData.address) {
      return res.status(400).json({
        success: false,
        error: "ownerId, title, and address are required",
      });
    }

    const property = new Property({
      ownerId: new mongoose.Types.ObjectId(propertyData.ownerId),
      title: propertyData.title,
      description: propertyData.description || "",
      type: propertyData.type,
      address: propertyData.address,
      latitude: propertyData.latitude || 0,
      longitude: propertyData.longitude || 0,
      city: propertyData.city || "",
      budget: propertyData.budget || { min: 0, max: 0 },
      bedrooms: propertyData.bedrooms || 1,
      bathrooms: propertyData.bathrooms || 1,
      amenities: propertyData.amenities || [],
      photos: propertyData.photos || [],
      categorizedImages: propertyData.categorizedImages || {},
      videoUrl: propertyData.videoUrl || "",
      ownerVerified: false,
      ownerVerifiedAt: null,
      verified: false,
      safetyRating: 0,
      reviews: [],
      landmarks: propertyData.landmarks || [],
      availableFrom: propertyData.availableFrom
        ? new Date(propertyData.availableFrom)
        : new Date(),
    });

    await property.save();

    // Update owner's properties list
    try {
      await OwnerProfile.findByIdAndUpdate(
        propertyData.ownerId,
        { $push: { properties: property._id } },
        { upsert: false },
      );
    } catch (e) {
      console.log("Error updating owner profile:", e);
    }

    // Convert S3 keys to presigned URLs before sending response
    const propertyWithUrls = await convertKeysToUrls(property);

    res.status(201).json({
      success: true,
      data: propertyWithUrls,
      message: "Property created successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create property",
    });
  }
});

// PATCH /api/properties/:id/owner-verification - Owner verifies their own property listing
router.patch(
  "/:id/owner-verification",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;

      const property = await Property.findById(id);
      if (!property) {
        return res.status(404).json({
          success: false,
          error: "Property not found",
        });
      }

      if (property.ownerId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: "Only property owner can verify this listing",
        });
      }

      property.ownerVerified = true;
      property.ownerVerifiedAt = new Date();
      property.updatedAt = new Date();
      await property.save();

      const propertyWithUrls = await convertKeysToUrls(property);

      return res.json({
        success: true,
        data: propertyWithUrls,
        message: "Property owner verification completed",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to verify property",
      });
    }
  },
);

// PUT /api/properties/:id - Update a property
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Handle mongoose ObjectId for ownerId if present
    if (updates.ownerId) {
      updates.ownerId = new mongoose.Types.ObjectId(updates.ownerId);
    }

    const property = await Property.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true },
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    // Convert S3 keys to presigned URLs before sending response
    const propertyWithUrls = await convertKeysToUrls(property);

    res.json({
      success: true,
      data: propertyWithUrls,
      message: "Property updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update property",
    });
  }
});

// DELETE /api/properties/:id - Delete a property
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    await Property.findByIdAndDelete(id);

    // Update owner's properties list
    if (property.ownerId) {
      try {
        await OwnerProfile.findByIdAndUpdate(property.ownerId, {
          $pull: { properties: property._id },
        });
      } catch (e) {
        console.log("Error updating owner profile:", e);
      }
    }

    res.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete property",
    });
  }
});

// GET /api/properties/owner/:ownerId - Get properties by owner
router.get("/owner/:ownerId", async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.params;

    const properties = await Property.find({
      ownerId: new mongoose.Types.ObjectId(ownerId),
    });

    // Convert S3 keys to presigned URLs
    const propertiesWithUrls = await Promise.all(
      properties.map((prop) => convertKeysToUrls(prop)),
    );

    res.json({
      success: true,
      data: propertiesWithUrls,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch properties",
    });
  }
});

// GET /api/properties/search/nearby - Get nearby properties
router.get("/search/nearby", async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: "latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const rad = Number(radius);

    // Fetch all properties from MongoDB
    const allProperties = await Property.find({});

    const properties: any[] = [];
    for (const property of allProperties) {
      // Simple distance calculation (approximate)
      const distance = Math.sqrt(
        Math.pow((property.latitude - lat) * 111, 2) +
          Math.pow((property.longitude - lng) * 111, 2) * 1000,
      );

      if (distance <= rad / 1000) {
        const propWithUrls = await convertKeysToUrls(property);
        properties.push({
          ...propWithUrls,
          distance: Math.round(distance * 1000),
        });
      }
    }

    // Sort by distance
    properties.sort((a: any, b: any) => a.distance - b.distance);

    res.json({
      success: true,
      data: properties,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch nearby properties",
    });
  }
});

export default router;
