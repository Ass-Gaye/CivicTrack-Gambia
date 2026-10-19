import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler, notFound } from './middleware/error'
import reportRoutes from './routes/reports'
import authRoutes from './routes/auth'
import officerRoutes from './routes/officer'

dotenv.config()

export const app = express()

const PORT = Number(process.env.PORT) || 4000

/**
 * Allowed CORS origins. Comma-separated list from CORS_ORIGINS env var,
 * with sensible localhost dev defaults. Credentials are enabled so the
 * HttpOnly session cookie is sent cross-origin.
 */
const defaultOrigins = ['http://localhost:5173', 'http://localhost:5175']
const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : []
const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])]

const corsOrigin = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
) => {
  // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
  if (!origin) {
    callback(null, true)
    return
  }
  if (allowedOrigins.includes(origin)) {
    callback(null, true)
  } else {
    callback(new Error(`Not allowed by CORS: ${origin}`))
  }
}

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ data: { status: 'ok', time: new Date().toISOString() } })
})

app.use('/api/reports', reportRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/officer', officerRoutes)

app.use(notFound)
app.use(errorHandler)

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`CivicTrack API listening on http://localhost:${PORT}`)
  })
}
