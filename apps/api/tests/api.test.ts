import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import { app } from '../src/index'
import { signToken } from '../src/lib/auth'

const request = (await import('supertest')).default

// Mock the Resend SDK so no real emails are sent and no network is required.
// The email service reads RESEND_API_KEY lazily; it is set from apps/api/.env
// (or below in beforeAll) so the provider is constructed with a mocked transport.
const sendMock = vi.fn()
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}))

import { escapeHtml, buildConfirmationHtml, buildConfirmationText } from '../src/services/email.service'

beforeEach(() => {
  sendMock.mockReset()
  sendMock.mockResolvedValue({ data: { id: 'resend_mock_id' } })
})

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
      streetNumber: '10A',
      status: 'SUBMITTED',
      updates: {
        create: [{ newStatus: 'SUBMITTED', publicNote: 'Test note' }],
      },
    },
  })
  reportId = report.id
}, 60000)

afterAll(async () => {
  await prisma.$disconnect()
  appServer?.close()
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
      streetNumber: '12',
      contactName: 'Test User',
      contactEmail: 'citizen@example.gm',
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
      streetNumber: '1',
      contactEmail: 'citizen@example.gm',
    })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects submissions with missing, empty, or whitespace-only street numbers', async () => {
    const payload = {
      title: 'Blocked drain at test street',
      description: 'The drain is blocked and water is standing in the road.',
      category: 'BLOCKED_DRAIN',
      location: 'Test Street',
      contactEmail: 'citizen@example.gm',
    }

    // Missing
    const missingRes = await request(app).post('/api/reports').send(payload)
    expect(missingRes.status).toBe(400)
    expect(missingRes.body.error.code).toBe('VALIDATION_ERROR')

    // Empty
    const emptyRes = await request(app).post('/api/reports').send({ ...payload, streetNumber: '' })
    expect(emptyRes.status).toBe(400)
    expect(emptyRes.body.error.code).toBe('VALIDATION_ERROR')

    // Whitespace only
    const whitespaceRes = await request(app).post('/api/reports').send({ ...payload, streetNumber: '   ' })
    expect(whitespaceRes.status).toBe(400)
    expect(whitespaceRes.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('generates unique reference codes on repeated submissions', async () => {
    const codes = new Set<string>()
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/reports').send({
        title: `Unique report ${i}`,
        description: 'A description long enough to pass validation for uniqueness testing.',
        category: 'OTHER',
        location: `Location ${i}`,
        streetNumber: `${i + 1}`,
        contactEmail: `user${i}@example.gm`,
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
    expect(res.body.data.streetNumber).toBe('10A')
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

  it('includes street number in officer report details and report listing', async () => {
    const detailRes = await request(app)
      .get(`/api/officer/reports/${reportId}`)
      .set('Cookie', `civictrack_session=${officerToken}`)
    expect(detailRes.status).toBe(200)
    expect(detailRes.body.data.streetNumber).toBe('10A')

    const listRes = await request(app)
      .get('/api/officer/reports')
      .set('Cookie', `civictrack_session=${officerToken}`)
    expect(listRes.status).toBe(200)
    const found = listRes.body.data.reports.find((r: any) => r.id === reportId)
    expect(found).toBeDefined()
    expect(found.streetNumber).toBe('10A')
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

describe('Email confirmation and delivery', () => {
  const basePayload = {
    title: 'Blocked drain at test street',
    description: 'The drain is blocked and water is standing in the road after heavy rain.',
    category: 'BLOCKED_DRAIN',
    location: 'Test Street',
    streetNumber: '12',
  }

  it('submits a valid report, sends the confirmation email, and returns the reference code', async () => {
    const res = await request(app).post('/api/reports').send({
      ...basePayload,
      contactName: 'Citizen User',
      contactEmail: 'Citizen@Example.GM',
    })
    expect(res.status).toBe(201)
    expect(res.body.data.referenceCode).toMatch(/^CTG-\d{4}-[A-Z0-9]+$/)
    expect(res.body.data.status).toBe('SUBMITTED')
    expect(res.body.data.emailSent).toBe(true)
    expect(res.body.data.message).toContain('confirmation email has been sent')

    // Email was handed to the mocked provider with a normalized recipient.
    expect(sendMock).toHaveBeenCalledTimes(1)
    const call = sendMock.mock.calls[0][0]
    expect(call.to).toBe('citizen@example.gm')
    expect(call.subject).toContain(res.body.data.referenceCode)
    expect(call.html).toContain(res.body.data.referenceCode)
    expect(call.text).toContain(res.body.data.referenceCode)

    // The report was persisted before email delivery.
    const report = await prisma.report.findFirst({
      where: { referenceCode: res.body.data.referenceCode },
    })
    expect(report).not.toBeNull()
    expect(report!.contactEmail).toBe('citizen@example.gm')
  })

  it('keeps the report and returns the reference code when the email provider fails', async () => {
    sendMock.mockRejectedValue(new Error('Provider downstream failure'))

    const res = await request(app).post('/api/reports').send({
      ...basePayload,
      contactEmail: 'fail@example.gm',
    })
    expect(res.status).toBe(201)
    expect(res.body.data.referenceCode).toMatch(/^CTG-\d{4}-[A-Z0-9]+$/)
    expect(res.body.data.status).toBe('SUBMITTED')
    expect(res.body.data.emailSent).toBe(false)
    expect(res.body.data.message).toContain('could not be sent')

    // Report remains saved despite the delivery failure.
    const report = await prisma.report.findFirst({
      where: { referenceCode: res.body.data.referenceCode },
    })
    expect(report).not.toBeNull()
    expect(report!.contactEmail).toBe('fail@example.gm')
  })

  it('rejects a missing or invalid email', async () => {
    const missingRes = await request(app).post('/api/reports').send({ ...basePayload })
    expect(missingRes.status).toBe(400)
    expect(missingRes.body.error.code).toBe('VALIDATION_ERROR')

    const invalidRes = await request(app).post('/api/reports').send({
      ...basePayload,
      contactEmail: 'not-an-email',
    })
    expect(invalidRes.status).toBe(400)
    expect(invalidRes.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('does not expose the citizen email in public tracking', async () => {
    const res = await request(app).post('/api/reports').send({
      ...basePayload,
      contactEmail: 'private@example.gm',
    })
    expect(res.status).toBe(201)

    const trackRes = await request(app).get(
      `/api/reports/track/${res.body.data.referenceCode}`
    )
    expect(trackRes.status).toBe(200)
    expect(JSON.stringify(trackRes.body.data)).not.toContain('private@example.gm')
    expect(trackRes.body.data).not.toHaveProperty('contactEmail')
    expect(trackRes.body.data).not.toHaveProperty('contactName')
    expect(trackRes.body.data).not.toHaveProperty('contactPhone')
  })

  it('resends the confirmation email for an existing report', async () => {
    const submitRes = await request(app).post('/api/reports').send({
      ...basePayload,
      contactEmail: 'resend@example.gm',
    })
    expect(submitRes.status).toBe(201)
    const reference = submitRes.body.data.referenceCode

    const resendRes = await request(app).post(
      `/api/reports/track/${reference}/resend-confirmation`
    )
    expect(resendRes.status).toBe(200)
    expect(resendRes.body.data.emailSent).toBe(true)
    expect(resendRes.body.data.referenceCode).toBe(reference)

    const lastCall = sendMock.mock.calls[sendMock.mock.calls.length - 1][0]
    expect(lastCall.to).toBe('resend@example.gm')
  })

  it('returns 404 for an unknown reference and 400 when no email is on file', async () => {
    const unknown = await request(app).post(
      '/api/reports/track/CTG-NOPE-9999/resend-confirmation'
    )
    expect(unknown.status).toBe(404)

    // CTG-TEST-0001 is seeded without a contact email.
    const noEmail = await request(app).post('/api/reports/track/CTG-TEST-0001/resend-confirmation')
    expect(noEmail.status).toBe(400)
    expect(noEmail.body.error.code).toBe('NO_EMAIL_ON_FILE')
  })

  it('rate-limits the resend confirmation endpoint', async () => {
    const submitRes = await request(app).post('/api/reports').send({
      ...basePayload,
      contactEmail: 'ratelimit@example.gm',
    })
    expect(submitRes.status).toBe(201)
    const reference = submitRes.body.data.referenceCode

    const statuses: number[] = []
    for (let i = 0; i < 4; i++) {
      const r = await request(app).post(
        `/api/reports/track/${reference}/resend-confirmation`
      )
      statuses.push(r.status)
    }
    // Earlier tests in this file also hit this rate-limited route, so the
    // exact counter value varies; what matters is that the limit is enforced
    // and the final request is rejected with 429.
    expect(statuses.every((s) => s === 200 || s === 429)).toBe(true)
    expect(statuses.at(-1)).toBe(429)
    expect(statuses.filter((s) => s === 429).length).toBeGreaterThanOrEqual(1)
  })
})

describe('Email content', () => {
  const params = {
    to: 'citizen@example.gm',
    referenceCode: 'CTG-2026-ABC123',
    title: 'Blocked drain at Serekunda market',
    categoryLabel: 'Blocked drain',
    location: 'Serekunda Market Roundabout, Kanifing',
    trackingUrl: 'https://civictrack.example.gm/track/CTG-2026-ABC123',
  }

  it('escapes HTML in user-supplied fields', () => {
    const unsafe = '<img src=x onerror=alert(1)>'
    const html = buildConfirmationHtml({
      ...params,
      title: unsafe,
      categoryLabel: unsafe,
      location: unsafe,
    })
    // Raw markup must never be inserted; only the escaped form may appear.
    expect(html).not.toContain(unsafe)
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(escapeHtml(unsafe)).toBe('&lt;img src=x onerror=alert(1)&gt;')
    expect(escapeHtml('&<>""\'\'')).toBe('&amp;&lt;&gt;&quot;&quot;&#39;&#39;')
  })

  it('includes the reference code, complaint summary, and tracking link in HTML and text', () => {
    const html = buildConfirmationHtml(params)
    const text = buildConfirmationText(params)

    expect(html).toContain('CivicTrack Gambia')
    expect(html).toContain('Your report has been received')
    expect(html).toContain(params.referenceCode)
    expect(html).toContain(params.title)
    expect(html).toContain(params.categoryLabel)
    expect(html).toContain(params.location)
    expect(html).toContain(params.trackingUrl)
    expect(html).toContain('retain this email')

    expect(text).toContain(params.referenceCode)
    expect(text).toContain(params.title)
    expect(text).toContain(params.trackingUrl)
    expect(text).toContain('retain this email')
  })

  it('contains no passwords, tokens, or secrets', () => {
    const html = buildConfirmationHtml(params)
    const text = buildConfirmationText(params)
    for (const content of [html, text]) {
      expect(content).not.toContain('password')
      expect(content).not.toContain('token')
      expect(content).not.toContain('secret')
      expect(content).not.toContain(params.to)
    }
  })
})

describe('Geographic Dropdowns & Locations API', () => {
  it('returns all eight Local Government Areas (LGAs) with accurate names and official distinctions', async () => {
    const res = await request(app).get('/api/locations/lgas')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(8)

    const expectedLgas = [
      'Banjul City Council',
      'Kanifing Municipal Council',
      'Brikama Area Council',
      'Mansakonko Area Council',
      'Kerewan Area Council',
      'Kuntaur Area Council',
      'Janjanbureh Area Council',
      'Basse Area Council',
    ]

    const receivedNames = res.body.data.map((l: any) => l.name)
    for (const expected of expectedLgas) {
      expect(receivedNames).toContain(expected)
    }

    // Verify official administrative distinctions are preserved in the data model
    const banjul = res.body.data.find((l: any) => l.name === 'Banjul City Council')
    expect(banjul.councilType).toBe('City Council')
    expect(banjul.administrativeRegion).toBe('Greater Banjul Area')

    const kanifing = res.body.data.find((l: any) => l.name === 'Kanifing Municipal Council')
    expect(kanifing.councilType).toBe('Municipal Council')
    expect(kanifing.administrativeRegion).toBe('Greater Banjul Area')

    const brikama = res.body.data.find((l: any) => l.name === 'Brikama Area Council')
    expect(brikama.councilType).toBe('Area Council')
    expect(brikama.administrativeRegion).toBe('West Coast Region')
  })

  it('returns dataset metadata with open licenses and source attributions', async () => {
    const res = await request(app).get('/api/locations/metadata')
    expect(res.status).toBe(200)
    expect(res.body.data.sources.some((s: any) => s.name === 'GeoNames')).toBe(true)
    expect(res.body.data.sources.some((s: any) => s.name === 'OpenStreetMap')).toBe(true)
    expect(res.body.data.totalLocations).toBeGreaterThan(2000)
    expect(res.body.data.coverageLimitations).toBeDefined()
  })

  it('filters locations by LGA and returns verified entries for all 8 LGAs', async () => {
    const lgas = ['banjul', 'kanifing', 'brikama', 'mansakonko', 'kerewan', 'kuntaur', 'janjanbureh', 'basse']

    for (const lgaId of lgas) {
      const res = await request(app).get(`/api/locations?lga=${lgaId}`)
      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThan(10)
      expect(res.body.data.every((item: any) => item.lgaId === lgaId)).toBe(true)
      expect(res.body.data.every((item: any) => item.id && item.name && item.type)).toBe(true)
    }
  })

  it('searches locations by query keyword within an LGA', async () => {
    const res = await request(app).get('/api/locations?lga=kanifing&search=serekunda')
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    expect(res.body.data.some((l: any) => l.name.toLowerCase().includes('serekunda'))).toBe(true)
  })

  it('returns 404 for an unknown LGA', async () => {
    const res = await request(app).get('/api/locations?lga=nonexistent_council')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('LGA_NOT_FOUND')
  })

  it('fetches a single location by ID with parent LGA metadata', async () => {
    const listRes = await request(app).get('/api/locations?lga=banjul')
    const sample = listRes.body.data[0]

    const singleRes = await request(app).get(`/api/locations/${sample.id}`)
    expect(singleRes.status).toBe(200)
    expect(singleRes.body.data.id).toBe(sample.id)
    expect(singleRes.body.data.lgaName).toBe('Banjul City Council')
  })
})

describe('Report Submission with Geographic LGA Validation', () => {
  it('successfully creates reports for each of the eight LGAs with verified locations', async () => {
    const lgaTests = [
      { lga: 'banjul', search: 'Independence Drive' },
      { lga: 'kanifing', search: 'Bakau' },
      { lga: 'brikama', search: 'Brikama' },
      { lga: 'mansakonko', search: 'Soma' },
      { lga: 'kerewan', search: 'Barra' },
      { lga: 'kuntaur', search: 'Kuntaur' },
      { lga: 'janjanbureh', search: 'Bansang' },
      { lga: 'basse', search: 'Basse' },
    ]

    for (const testCase of lgaTests) {
      const locRes = await request(app).get(`/api/locations?lga=${testCase.lga}&search=${encodeURIComponent(testCase.search)}`)
      expect(locRes.body.data.length).toBeGreaterThan(0)
      const locationItem = locRes.body.data[0]

      const postRes = await request(app).post('/api/reports').send({
        title: `Pothole reported in ${testCase.lga}`,
        description: 'Road damage requiring municipal repair team inspection.',
        category: 'DAMAGED_ROAD',
        lga: testCase.lga,
        locationId: locationItem.id,
        streetNumber: '42',
        contactEmail: `citizen_${testCase.lga}@example.gm`,
      })

      expect(postRes.status).toBe(201)
      expect(postRes.body.data.referenceCode).toBeDefined()

      // Verify tracking response returns readable location and LGA name
      const trackRes = await request(app).get(`/api/reports/track/${postRes.body.data.referenceCode}`)
      expect(trackRes.status).toBe(200)
      expect(trackRes.body.data.lga).toBe(testCase.lga)
      expect(trackRes.body.data.lgaName).toBeDefined()
      expect(trackRes.body.data.location).toBe(locationItem.name)
      expect(trackRes.body.data.streetNumber).toBe('42')
    }
  })

  it('rejects submissions where the location does not belong to the selected LGA', async () => {
    // Pick a location from Basse Area Council
    const basseLocRes = await request(app).get('/api/locations?lga=basse')
    const basseLocation = basseLocRes.body.data[0]

    // Attempt to submit under Banjul City Council with Basse location
    const mismatchRes = await request(app).post('/api/reports').send({
      title: 'Mismatched location test',
      description: 'Attempting cross-LGA submission which should fail.',
      category: 'DAMAGED_ROAD',
      lga: 'banjul',
      locationId: basseLocation.id,
      streetNumber: '1',
      contactEmail: 'user@example.gm',
    })

    expect(mismatchRes.status).toBe(400)
    expect(mismatchRes.body.error.code).toBe('VALIDATION_ERROR')
    expect(JSON.stringify(mismatchRes.body.error)).toContain('belongs to')
  })

  it('supports the Other / Not listed workflow when custom location text is provided', async () => {
    const res = await request(app).post('/api/reports').send({
      title: 'Missing compound access road',
      description: 'The feeder lane to the new health post has eroded.',
      category: 'DAMAGED_ROAD',
      lga: 'kanifing',
      locationId: 'OTHER',
      customLocation: 'New Layout, behind Bundung Borehole',
      streetNumber: '7B',
      contactEmail: 'citizen@example.gm',
    })

    expect(res.status).toBe(201)
    const ref = res.body.data.referenceCode

    const trackRes = await request(app).get(`/api/reports/track/${ref}`)
    expect(trackRes.status).toBe(200)
    expect(trackRes.body.data.location).toBe('New Layout, behind Bundung Borehole')
    expect(trackRes.body.data.lga).toBe('kanifing')
    expect(trackRes.body.data.lgaName).toBe('Kanifing Municipal Council')
  })

  it('rejects Other / Not listed submissions when custom location text is missing or blank', async () => {
    const res = await request(app).post('/api/reports').send({
      title: 'Missing location details test',
      description: 'Testing that Other without text is rejected.',
      category: 'OTHER',
      lga: 'kanifing',
      locationId: 'OTHER',
      customLocation: '   ',
      streetNumber: '15',
      contactEmail: 'citizen@example.gm',
    })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects an invalid or fabricated LGA name', async () => {
    const res = await request(app).post('/api/reports').send({
      title: 'Invalid LGA test',
      description: 'Attempting invalid LGA submission.',
      category: 'OTHER',
      lga: 'atlantis_area_council',
      locationId: 'OTHER',
      customLocation: 'Custom place',
      streetNumber: '1',
      contactEmail: 'citizen@example.gm',
    })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
