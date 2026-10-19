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
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(
  cors({
    origin: frontendUrl,
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
