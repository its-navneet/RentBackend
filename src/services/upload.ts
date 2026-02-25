/**
 * Upload Service
 * S3 upload functionality for images and videos
 * Includes fallback for development when S3 credentials aren't configured
 */

import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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

// Upload file to S3 (or local storage if AWS not configured)
export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<{ url: string; key: string }> => {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;
  const key = `${folder}/${fileName}`;

  // If AWS credentials are not configured, use local storage fallback
  if (!isAWSConfigured()) {
    console.log('⚠️ AWS credentials not configured, using local storage fallback');
    return saveToLocalStorage(file, folder, fileName);
  }

  // Determine content type
  let contentType = file.mimetype;
  if (!contentType) {
    contentType = 'application/octet-stream';
  }

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: contentType,
  };

  try {
    // Use multipart upload for larger files
    const upload = new Upload({
      client: s3Client,
      params: uploadParams,
    });

    await upload.done();

    // Generate the public URL
    const url = `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`;

    return { url, key };
  } catch (error: any) {
    console.error('S3 Upload Error:', error.message);
    
    // If S3 fails (invalid credentials, network issues, etc.), fall back to local storage
    console.log('⚠️ S3 upload failed, falling back to local storage');
    return saveToLocalStorage(file, folder, fileName);
  }
};

// Local storage fallback when AWS is not configured
const saveToLocalStorage = async (
  file: Express.Multer.File,
  folder: string,
  fileName: string
): Promise<{ url: string; key: string }> => {
  const uploadDir = path.join(process.cwd(), 'uploads', folder);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, fileName);
  
  // Write file to disk
  fs.writeFileSync(filePath, file.buffer);
  
  // Return local URL
  const url = `/uploads/${folder}/${fileName}`;
  const key = `${folder}/${fileName}`;
  
  console.log(`✅ File saved locally: ${url}`);
  
  return { url, key };
};

// Upload multiple files to S3
export const uploadMultipleToS3 = async (
  files: Express.Multer.File[],
  folder: string = 'uploads'
): Promise<{ url: string; key: string }[]> => {
  const uploadPromises = files.map((file) => uploadToS3(file, folder));
  return await Promise.all(uploadPromises);
};

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
export const generatePresignedUrl = async (
  fileName: string,
  fileType: string,
  folder: string = 'uploads'
): Promise<{ uploadUrl: string; fileUrl: string; key: string }> => {
  if (!isAWSConfigured()) {
    throw new Error('AWS credentials not configured');
  }

  const fileExtension = path.extname(fileName);
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  // Generate presigned URL valid for 5 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  // Construct the final file URL
  const fileUrl = `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
};

export default {
  upload,
  uploadToS3,
  uploadMultipleToS3,
  deleteFromS3,
  generatePresignedUrl,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
};

