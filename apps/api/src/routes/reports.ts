import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { submitReport, trackReport, resendConfirmation } from '../controllers/report.controller'
import { validate } from '../middleware/validate'
import { createReportSchema, referenceCodeParams } from '../schemas/report'
import { uploadImageMiddleware, validateUploadedFile } from '../middleware/upload'

const router = Router()

const isTest = process.env.NODE_ENV === 'test'

// Stricter limit for public submission: 20 requests per 15 minutes per IP (relaxed in test suite).
router.post(
  '/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 20,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  uploadImageMiddleware,
  validate(createReportSchema),
  validateUploadedFile,
  submitReport
)

// 30 tracking lookups per 15 minutes per IP (relaxed in test suite).
router.get(
  '/track/:reference',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 30,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  validate(referenceCodeParams, 'params'),
  trackReport
)

// Re-send a confirmation email for an existing report. Strict limit to reduce
// abuse: 3 requests per 15 minutes per IP. The recipient is always the stored
// contact address, never a user-supplied address.
router.post(
  '/track/:reference/resend-confirmation',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 3, standardHeaders: true, legacyHeaders: false }),
  validate(referenceCodeParams, 'params'),
  resendConfirmation
)

router.get('/categories', (_req, res) => {
  res.json({
    data: [
      { value: 'BLOCKED_DRAIN', label: 'Blocked drain' },
      { value: 'WASTE_DISPOSAL', label: 'Improper waste disposal' },
      { value: 'DAMAGED_ROAD', label: 'Damaged road' },
      { value: 'STREETLIGHT', label: 'Streetlight problem' },
      { value: 'DAMAGED_FACILITY', label: 'Damaged public facility' },
      { value: 'OTHER', label: 'Other infrastructure issue' },
    ],
  })
})

export default router
