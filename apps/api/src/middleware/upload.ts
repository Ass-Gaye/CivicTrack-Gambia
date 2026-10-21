import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { validateImageFile } from '../services/cloudinary.service'

/**
 * Multer storage configuration.
 *
 * We use MemoryStorage so the file buffer is available in `req.file.buffer`
 * for streaming directly to Cloudinary. Files are never written to disk.
 */
const storage = multer.memoryStorage()

/**
 * Configured multer instance for single image uploads.
 * Field name: 'image'
 */
export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'))
    }
    cb(null, true)
  },
}).single('image')

/**
 * Express middleware wrapper for multer's single('image').
 * Converts multer errors into Express next(err) calls.
 */
export function uploadImageMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  uploadImage(req, res, (err?: unknown) => {
    if (err) {
      // Multer error (e.g. file too large, unexpected field)
      res.status(400).json({
        error: {
          code: 'INVALID_FILE',
          message: err instanceof Error ? err.message : 'Invalid file upload',
        },
      })
      return
    }
    next()
  })
}

/**
 * Additional validation for the uploaded file using the shared validator.
 * Runs after multer has successfully parsed the file.
 */
export function validateUploadedFile(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const file = req.file
  if (!file) {
    // No file uploaded — that's OK, image is optional
    next()
    return
  }

  const error = validateImageFile(file)
  if (error) {
    res.status(400).json({
      error: {
        code: 'INVALID_FILE',
        message: error,
      },
    })
    return
  }

  next()
}
