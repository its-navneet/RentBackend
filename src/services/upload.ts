/**
 * Upload Service
 * S3 upload functionality for images and videos
 * Includes fallback for development when S3 credentials aren't configured
 */

import { S3Client, DeleteObjectCommand, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { log } from 'console';
import { userInfo } from 'os';

// S3 Configuration
const s3Config = {
  region: 'ap-south-1',
  credentials: {
    accessKeyId:  process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey:  process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const BUCKET_NAME = 'bbsr-nest';

// Check if AWS credentials are configured (either via env vars or hardcoded)
const isAWSConfigured = () => {
  // Check environment variables
  const envConfigured = process.env.AWS_ACCESS_KEY_ID && 
                        process.env.AWS_SECRET_ACCESS_KEY && 
                        process.env.AWS_ACCESS_KEY_ID !== '' &&
                        process.env.AWS_SECRET_ACCESS_KEY !== '';
  return envConfigured ;
};

log('AWS Configured:',process.env.AWS_ACCESS_KEY_ID, isAWSConfigured());  

// Allowed MIME types
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
];

export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// Max file sizes
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Initialize S3 client
const s3Client = new S3Client(s3Config);

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Use the larger limit since we handle both
  },
});

// Delete file from S3
export const deleteFromS3 = async (key: string): Promise<void> => {
  const deleteParams = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(deleteParams));
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

// Generate presigned URL for direct upload
// Generate presigned URL for direct upload
export const generatePresignedUrl = async (
  fileName?: string,
  fileType?: string,
  folder: string = 'uploads'
): Promise<{ uploadUrl: string; key: string }> => {
  if (!isAWSConfigured()) {
    throw new Error('AWS credentials not configured');
  }

  const generatedFileName = fileName || `file-${Date.now()}`;
  const generatedFileType = fileType || 'application/octet-stream';
  const fileExtension = path.extname(generatedFileName);
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: generatedFileType,
  });

  // Generate presigned URL valid for 5 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return { uploadUrl, key };
};

// Generate presigned read URL from S3 key
export const generateReadPresignedUrl = async (
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> => {
  if (!isAWSConfigured()) {
    throw new Error('AWS credentials not configured');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  // Generate presigned URL for reading
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
};

export default {
  deleteFromS3,
  generatePresignedUrl,
  generateReadPresignedUrl,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
};

