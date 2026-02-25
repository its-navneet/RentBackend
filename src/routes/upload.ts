/**
 * Upload Routes
 * API endpoints for uploading images and videos to S3
 * Compatible with mobile app StorageService
 */

import express, { Request, Response } from "express";
import {
  upload,
  uploadToS3,
  uploadMultipleToS3,
  deleteFromS3,
  generatePresignedUrl,
  ALLOWED_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "../services/upload";
import auth from "../services/auth";
import { log } from "console";

const router = express.Router();

// Middleware to verify authentication
const authenticate = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  log("Auth Header:", authHeader);
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

  (req as any).user = currentUser;
  next();
};

// POST /api/upload - Upload a single file (matches StorageService.uploadFile)
// Accepts multipart form data with 'file' and 'path' fields
// Note: Made public for mobile app compatibility - add auth in production
router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file provided",
      });
    }

    // Extract folder from path or use default
    const folder = req.body.path ? req.body.path.split("/")[0] : "uploads";
    const result = await uploadToS3(req.file, folder);

    res.json({
      success: true,
      url: result.url,
      key: result.key,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to upload file",
    });
  }
});

// POST /api/upload/single - Upload a single file (image or video)
// Compatible with StorageService.uploadSingle - returns signedUrl in response
// Note: Made public for mobile app compatibility - add auth in production
router.post(
  "/single",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file provided",
        });
      }

      const folder = req.body.category || req.body.folder || "uploads";
      const result = await uploadToS3(req.file, folder);

      // Return signedUrl at top level for compatibility with StorageService.uploadSingle
      res.json({
        success: true,
        signedUrl: result.url, // For StorageService.uploadSingle compatibility
        url: result.url,
        key: result.key,
        data: {
          url: result.url,
          key: result.key,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          isImage: ALLOWED_IMAGE_TYPES.includes(req.file.mimetype),
          isVideo: ALLOWED_VIDEO_TYPES.includes(req.file.mimetype),
        },
        message: "File uploaded successfully",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload file",
      });
    }
  },
);

// POST /api/upload/multiple - Upload multiple files (images or videos)
router.post(
  "/multiple",
  authenticate,
  upload.array("files", 10),
  async (req: Request, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({
          success: false,
          error: "No files provided",
        });
      }

      const files = req.files as Express.Multer.File[];
      const folder = req.body.folder || "uploads";

      // Limit to 10 files
      if (files.length > 10) {
        return res.status(400).json({
          success: false,
          error: "Maximum 10 files allowed",
        });
      }

      const results = await uploadMultipleToS3(files, folder);

      const uploadedFiles = results.map((result, index) => ({
        url: result.url,
        key: result.key,
        originalName: files[index].originalname,
        mimetype: files[index].mimetype,
        size: files[index].size,
        isImage: ALLOWED_IMAGE_TYPES.includes(files[index].mimetype),
        isVideo: ALLOWED_VIDEO_TYPES.includes(files[index].mimetype),
      }));

      res.json({
        success: true,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length,
        },
        message: `${uploadedFiles.length} files uploaded successfully`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload files",
      });
    }
  },
);

// POST /api/upload/image - Upload a single image
router.post(
  "/image",
  authenticate,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image provided",
        });
      }

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: "Invalid image type. Allowed: jpeg, png, gif, webp, svg",
        });
      }

      // Validate file size
      if (req.file.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({
          success: false,
          error: `Image size too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        });
      }

      const folder = req.body.folder || "images";
      const result = await uploadToS3(req.file, folder);

      res.json({
        success: true,
        data: {
          url: result.url,
          key: result.key,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        message: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload image",
      });
    }
  },
);

// POST /api/upload/video - Upload a single video
router.post(
  "/video",
  authenticate,
  upload.single("video"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No video provided",
        });
      }

      // Validate file type
      if (!ALLOWED_VIDEO_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: "Invalid video type. Allowed: mp4, mpeg, quicktime, webm, avi",
        });
      }

      // Validate file size
      if (req.file.size > MAX_VIDEO_SIZE) {
        return res.status(400).json({
          success: false,
          error: `Video size too large. Maximum size: ${MAX_VIDEO_SIZE / 1024 / 1024}MB`,
        });
      }

      const folder = req.body.folder || "videos";
      const result = await uploadToS3(req.file, folder);

      res.json({
        success: true,
        data: {
          url: result.url,
          key: result.key,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        message: "Video uploaded successfully",
      });
    } catch (error: any) {
      console.error("Video upload error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to upload video",
      });
    }
  },
);

// DELETE /api/upload - Delete a file (matches StorageService.deleteFile)
// Note: Made public for mobile app compatibility - add auth in production
router.delete("/", async (req: Request, res: Response) => {
  try {
    const { path } = req.query;

    if (!path || typeof path !== "string") {
      return res.status(400).json({
        success: false,
        error: "Path is required",
      });
    }

    await deleteFromS3(path);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete file",
    });
  }
});

// GET /api/upload/url - Get file URL (matches StorageService.getFileUrl)
// Note: Made public for mobile app compatibility - add auth in production
router.get("/url", async (req: Request, res: Response) => {
  try {
    const { path } = req.query;

    if (!path || typeof path !== "string") {
      return res.status(400).json({
        success: false,
        error: "Path is required",
      });
    }

    // If it's already a full URL, return as-is
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return res.json({
        success: true,
        url: path,
      });
    }

    // Generate public URL from the path
    const BUCKET_NAME = "bbsr-nest";
    const region = "ap-south-1";
    const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${path}`;

    res.json({
      success: true,
      url,
    });
  } catch (error: any) {
    console.error("Get URL error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get file URL",
    });
  }
});

// GET /api/upload/allowed-types - Get allowed file types
router.get("/allowed-types", (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      imageTypes: ALLOWED_IMAGE_TYPES,
      videoTypes: ALLOWED_VIDEO_TYPES,
      maxImageSize: MAX_IMAGE_SIZE,
      maxVideoSize: MAX_VIDEO_SIZE,
    },
  });
});

// POST /api/upload/presigned - Generate presigned URL for direct upload
// Client can upload directly to S3 using this URL
router.post("/presigned", async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        error: "fileName and fileType are required",
      });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(fileType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
      });
    }

    const result = await generatePresignedUrl(
      fileName,
      fileType,
      folder || "uploads",
    );

    res.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        fileUrl: result.fileUrl,
        key: result.key,
      },
      message: "Presigned URL generated successfully",
    });
  } catch (error: any) {
    console.error("Presigned URL error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate presigned URL",
    });
  }
});

export default router;
