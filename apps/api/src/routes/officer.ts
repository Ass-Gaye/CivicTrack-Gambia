import { Router } from 'express'
import { authenticateOfficer } from '../middleware/auth'
import { validate } from '../middleware/validate'
import {
  getDashboard,
  listOfficerReports,
  getOfficerReport,
  patchReportStatus,
} from '../controllers/report.controller'
import { updateStatusSchema } from '../schemas/report'

const router = Router()

// All officer endpoints require an authenticated session.
router.use(authenticateOfficer)

router.get('/dashboard', getDashboard)
router.get('/reports', listOfficerReports)
router.get('/reports/:id', getOfficerReport)
router.patch(
  '/reports/:id/status',
  validate(updateStatusSchema),
  patchReportStatus
)

export default router
