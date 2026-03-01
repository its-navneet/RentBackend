
/**
 * Upload Routes
 * API endpoint for getting presigned URL from S3 bucket
 */

import express, { Request, Response } from "express";
import {
  ALLOWED_TYPES,
  generatePresignedUrl,
  generateReadPresignedUrl,
} from "../services/upload";

const router = express.Router();

const isHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

// POST /api/upload/presigned - Generate presigned URL for direct S3 upload
// Returns uploadUrl and S3 key (not full URL)
router.post("/presigned", async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, folder } = req.body;

    if (!fileName || typeof fileName !== "string") {
      return res.status(400).json({
        success: false,
        error: "fileName is required",
      });
    }

    if (!fileType || typeof fileType !== "string") {
      return res.status(400).json({
        success: false,
        error: "fileType is required",
      });
    }

    if (!ALLOWED_TYPES.includes(fileType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
      });
    }
    
    const result = await generatePresignedUrl(fileName, fileType, folder);

    res.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        key: result.key,  // Store this in DB, not the URL
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

// POST /api/upload/presigned-batch - Generate multiple presigned URLs
router.post("/presigned-batch", async (req: Request, res: Response) => {
  try {
    const { files } = req.body;
    
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Files array is required",
      });
    }

    for (const file of files) {
      if (!file?.fileName || typeof file.fileName !== "string") {
        return res.status(400).json({
          success: false,
          error: "Each file must include fileName",
        });
      }

      if (!file?.fileType || typeof file.fileType !== "string") {
        return res.status(400).json({
          success: false,
          error: "Each file must include fileType",
        });
      }

      if (!ALLOWED_TYPES.includes(file.fileType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        });
      }
    }

    const results = await Promise.all(
      files.map((file: { fileName: string; fileType: string; folder?: string }) =>
        generatePresignedUrl(file.fileName, file.fileType, file.folder)
      )
    );

    res.json({
      success: true,
      data: results.map(r => ({ uploadUrl: r.uploadUrl, key: r.key })),
      message: "Presigned URLs generated successfully",
    });
  } catch (error: any) {
    console.error("Presigned batch URL error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate presigned URLs",
    });
  }
});

// POST /api/upload/read-url - Generate presigned read URL from S3 key
// Backend calls this when returning properties to client
router.post("/read-url", async (req: Request, res: Response) => {
  try {
    const { keys } = req.body; // Array of S3 keys
    
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Keys array is required",
      });
    }

    const urls = await Promise.all(
      keys.map(async (key: string) => {
        if (!key || typeof key !== "string") return key;
        if (isHttpUrl(key)) return key;

        try {
          return await generateReadPresignedUrl(key, 3600);
        } catch {
          return key;
        }
      })
    );

    res.json({
      success: true,
      data: {
        urls: urls.map((url, index) => ({ key: keys[index], url })),
      },
    });
  } catch (error: any) {
    console.error("Read URL error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate read URLs",
    });
  }
});

export default router;

