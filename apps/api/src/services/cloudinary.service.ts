import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'

/**
 * Cloudinary service for image uploads.
 *
 * All configuration is read from server-side environment variables only
 * (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).
 * Nothing in this file is imported by the Vite frontend, so API credentials
 * never reach the browser.
 */

/**
 * Minimal upload result returned to the caller.
 */
export interface CloudinaryUploadResult {
  url: string
  publicId: string
  secureUrl: string
  width: number
  height: number
  format: string
  bytes: number
}

/**
 * Configure the Cloudinary SDK from server-side environment variables.
 * Returns null when Cloudinary is not configured (e.g. local dev without
 * Cloudinary credentials). Callers must degrade gracefully.
 */
export function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return null
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  })

  return cloudinary
}

/**
 * Multer file interface (simplified to avoid namespace import issues).
 */
interface MulterFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer: Buffer
}

/**
 * Allowed MIME types for image uploads.
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

/**
 * Maximum file size in bytes (5 MB).
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Validate an uploaded file before sending to Cloudinary.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateImageFile(file: MulterFile): string | null {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return `Invalid file type "${file.mimetype}". Only JPEG, PNG, and WebP images are allowed.`
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024)
    return `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is ${maxMB} MB.`
  }

  return null
}

/**
 * Upload an image to Cloudinary.
 *
 * Returns the upload result on success, or throws an error if the upload
 * fails. Callers should catch and handle gracefully (e.g. report still
 * saved without image).
 */
export async function uploadImage(
  file: MulterFile
): Promise<CloudinaryUploadResult> {
  const cloudinaryClient = getCloudinary()
  if (!cloudinaryClient) {
    throw new Error('Cloudinary is not configured')
  }

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    cloudinaryClient.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'civictrack-gambia/reports',
        transformation: [
          { quality: 'auto:good' },
          { fetch_format: 'auto' },
        ],
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error ?? new Error('Unknown Cloudinary upload error'))
          return
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        })
      }
    ).end(file.buffer)
  })
}

/**
 * Delete an image from Cloudinary by public ID.
 * Used for cleanup when a report is removed or image is replaced.
 * Failures are logged but not thrown — orphaned images in Cloudinary
 * are acceptable for an MVP.
 */
export async function deleteImage(publicId: string): Promise<void> {
  const cloudinaryClient = getCloudinary()
  if (!cloudinaryClient) {
    return
  }

  try {
    await cloudinaryClient.uploader.destroy(publicId)
  } catch {
    // Ignore deletion errors — orphaned images are acceptable
  }
}
