import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { submitReport, trackReport } from '../controllers/report.controller'
import { validate } from '../middleware/validate'
import { createReportSchema, referenceCodeParams } from '../schemas/report'

const router = Router()

// Stricter limit for public submission: 20 requests per 15 minutes per IP.
router.post(
  '/',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false }),
  validate(createReportSchema),
  submitReport
)

// 30 tracking lookups per 15 minutes per IP.
router.get(
  '/track/:reference',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }),
  validate(referenceCodeParams, 'params'),
  trackReport
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
