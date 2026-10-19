import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { loginHandler, logoutHandler, meHandler } from '../controllers/auth.controller'
import { validate } from '../middleware/validate'
import { authenticateOfficer } from '../middleware/auth'
import { loginSchema } from '../schemas/auth'

const router = Router()

router.post(
  '/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false }),
  validate(loginSchema),
  loginHandler
)

router.post('/logout', logoutHandler)
router.get('/me', authenticateOfficer, meHandler)

export default router
