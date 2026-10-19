import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import { app } from '../src/index'
import { signToken } from '../src/lib/auth'

const request = (await import('supertest')).default

const prisma = new PrismaClient()

let appServer: ReturnType<typeof app.listen>
let officerToken: string
let reportId: string

async function seedDatabase() {
  execSync('npx prisma migrate deploy', {
    cwd: require('path').resolve(__dirname, '..'),
    stdio: 'pipe',
    env: { ...process.env },
  })
  // Make re-seeding safe: clear seeded reports (officer is upserted in seed.ts).
  await prisma.reportStatusUpdate.deleteMany()
  await prisma.report.deleteMany()

  execSync('npx tsx prisma/seed.ts', {
    cwd: require('path').resolve(__dirname, '..'),
    stdio: 'pipe',
    env: { ...process.env },
  })
}

beforeAll(async () => {
  await seedDatabase()
  appServer = app.listen(0)
  await new Promise((r) => appServer.once('listening', r))

  const officer = await prisma.officer.findUnique({
    where: { email: 'officer@civictrack.gm' },
  })
  officerToken = signToken({
    sub: officer!.id,
    email: officer!.email,
    role: officer!.role,
  })

  const report = await prisma.report.create({
    data: {
      referenceCode: 'CTG-TEST-0001',
      title: 'Test blocked drain',
      description: 'A test blocked drain description for automated tests.',
      category: 'BLOCKED_DRAIN',
      location: 'Test Community',
      status: 'SUBMITTED',
      updates: {
        create: [{ newStatus: 'SUBMITTED', publicNote: 'Test note' }],
      },
    },
  })
  reportId = report.id
})

afterAll(async () => {
  await prisma.$disconnect()
  appServer.close()
})

describe('API health', () => {
  it('responds successfully', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('ok')
  })
})

describe('Report submission', () => {
  it('saves a valid report with a unique reference code', async () => {
    const res = await request(app).post('/api/reports').send({
      title: 'Blocked drain at test street',
      description: 'The drain is blocked and water is standing in the road.',
      category: 'BLOCKED_DRAIN',
      location: 'Test Street',
      contactName: 'Test User',
    })
    expect(res.status).toBe(201)
    expect(res.body.data.referenceCode).toMatch(/^CTG-\d{4}-[A-Z0-9]+$/)
    expect(res.body.data.status).toBe('SUBMITTED')
  })

  it('rejects an invalid report submission', async () => {
    const res = await request(app).post('/api/reports').send({
      title: 'ab',
      description: 'too short',
      category: 'NOT_A_CATEGORY',
      location: 'x',
    })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('generates unique reference codes on repeated submissions', async () => {
    const codes = new Set<string>()
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/reports').send({
        title: `Unique report ${i}`,
        description: 'A description long enough to pass validation for uniqueness testing.',
        category: 'OTHER',
        location: `Location ${i}`,
      })
      expect(res.status).toBe(201)
      codes.add(res.body.data.referenceCode)
    }
    expect(codes.size).toBe(5)
  })
})

describe('Public tracking', () => {
  it('retrieves a report by reference code', async () => {
    const res = await request(app).get('/api/reports/track/CTG-TEST-0001')
    expect(res.status).toBe(200)
    expect(res.body.data.referenceCode).toBe('CTG-TEST-0001')
    expect(res.body.data.title).toBe('Test blocked drain')
    expect(res.body.data.status).toBe('SUBMITTED')
    expect(res.body.data.updates.length).toBeGreaterThan(0)
  })

  it('returns an appropriate error for an invalid reference', async () => {
    const res = await request(app).get('/api/reports/track/CTG-INVALID-REF')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
    expect(res.body.error.message).not.toContain('database')
    expect(res.body.error.message).not.toContain('prisma')
    expect(res.body.error.message).not.toContain('stack')
  })

  it('does not expose contact details in the public tracking response', async () => {
    const res = await request(app).get('/api/reports/track/CTG-TEST-0001')
    const body = JSON.stringify(res.body.data)
    expect(body).not.toContain('contactName')
    expect(body).not.toContain('contactPhone')
    expect(body).not.toContain('contactEmail')
    expect(res.body.data).not.toHaveProperty('contactName')
    expect(res.body.data).not.toHaveProperty('contactPhone')
    expect(res.body.data).not.toHaveProperty('contactEmail')
  })
})

describe('Officer authentication and status updates', () => {
  it('rejects status updates from unauthenticated users', async () => {
    const res = await request(app)
      .patch(`/api/officer/reports/${reportId}/status`)
      .send({ status: 'RESOLVED' })
    expect(res.status).toBe(401)
  })

  it('allows an authenticated officer to update a report', async () => {
    const res = await request(app)
      .patch(`/api/officer/reports/${reportId}/status`)
      .set('Cookie', `civictrack_session=${officerToken}`)
      .send({ status: 'IN_PROGRESS', publicNote: 'Test progress note from officer' })
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('IN_PROGRESS')
  })

  it('creates a status history record on status change', async () => {
    const updates = await prisma.reportStatusUpdate.findMany({
      where: { reportId },
      orderBy: { createdAt: 'desc' },
    })
    expect(updates.length).toBeGreaterThanOrEqual(2)
    const latest = updates[0]
    expect(latest.newStatus).toBe('IN_PROGRESS')
    expect(latest.publicNote).toBe('Test progress note from officer')
    expect(latest.previousStatus).toBe('SUBMITTED')
  })

  it('shows the latest status in the tracking response', async () => {
    const res = await request(app).get(`/api/reports/track/CTG-TEST-0001`)
    expect(res.body.data.status).toBe('IN_PROGRESS')
    expect(res.body.data.updates.some((u: any) => u.publicNote === 'Test progress note from officer')).toBe(true)
  })
})

describe('Dashboard counts', () => {
  it('reflects database records', async () => {
    const res = await request(app)
      .get('/api/officer/dashboard')
      .set('Cookie', `civictrack_session=${officerToken}`)
    expect(res.status).toBe(200)
    expect(typeof res.body.data.total).toBe('number')
    expect(res.body.data.total).toBeGreaterThanOrEqual(1)
    const sum =
      res.body.data.submitted +
      res.body.data.underReview +
      res.body.data.assigned +
      res.body.data.inProgress +
      res.body.data.resolved +
      res.body.data.rejected
    expect(sum).toBe(res.body.data.total)
  })
})
