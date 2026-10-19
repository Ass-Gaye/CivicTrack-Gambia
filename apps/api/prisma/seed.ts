import { PrismaClient, ReportCategory, ReportStatus, OfficerRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// All seeded content is fictional and created only to demonstrate the MVP.
const SAMPLE_REPORTS = [
  {
    referenceCode: 'CTG-2026-DRN001',
    title: 'Blocked drain at Serekunda market roundabout',
    description: 'Rainwater is not draining after heavy rain. The drain grate is blocked with refuse and standing water is blocking the road for pedestrians.',
    category: ReportCategory.BLOCKED_DRAIN,
    location: 'Serekunda Market Roundabout, Kanifing',
    status: ReportStatus.RESOLVED,
    contactName: 'Amadou Jallow',
    contactPhone: '+220 xxx xxxx',
    contactEmail: 'amadou.j@example.com',
    updates: [
      { newStatus: ReportStatus.SUBMITTED, publicNote: 'Report received by the civic team.' },
      { newStatus: ReportStatus.IN_PROGRESS, publicNote: 'Crew dispatched to clear the blockage.' },
      { newStatus: ReportStatus.RESOLVED, publicNote: 'Drain cleared and flowing. Road reopened.' },
    ],
  },
  {
    referenceCode: 'CTG-2026-WST002',
    title: 'Improper waste disposal near Bakoteh dumpsite road',
    description: 'Household waste has been dumped beside the road opposite the Bakoteh dumpsite access road, attracting pests and creating a smell for nearby compounds.',
    category: ReportCategory.WASTE_DISPOSAL,
    location: 'Bakoteh dumpsite access road',
    status: ReportStatus.IN_PROGRESS,
    contactName: 'Fatoumata Ceesay',
    contactPhone: '+220 xxx xxxx',
    updates: [
      { newStatus: ReportStatus.SUBMITTED, publicNote: 'Report received.' },
      { newStatus: ReportStatus.IN_PROGRESS, publicNote: 'Waste collection team notified.' },
    ],
  },
  {
    referenceCode: 'CTG-2026-RD003',
    title: 'Pothole on Banjul–Serekunda highway near Tallinding',
    description: 'A large pothole has formed on the inbound lane, damaging vehicles and forcing traffic toward the shoulder.',
    category: ReportCategory.DAMAGED_ROAD,
    location: 'Banjul–Serekunda highway, Tallinding',
    status: ReportStatus.UNDER_REVIEW,
    contactName: 'Ousman Bah',
    updates: [
      { newStatus: ReportStatus.SUBMITTED, publicNote: 'Report received by the civic team.' },
      { newStatus: ReportStatus.UNDER_REVIEW, publicNote: 'Engineering team assessing repair priority.' },
    ],
  },
  {
    referenceCode: 'CTG-2026-SLT004',
    title: 'Faulty streetlight on Kairaba Avenue',
    description: 'The streetlight outside the Kairaba Avenue petrol station has been out for two weeks, leaving the pedestrian crossing dark at night.',
    category: ReportCategory.STREETLIGHT,
    location: 'Kairaba Avenue, near petrol station',
    status: ReportStatus.ASSIGNED,
    contactName: 'Mariama Sanneh',
    contactEmail: 'mariama.s@example.com',
    updates: [
      { newStatus: ReportStatus.SUBMITTED, publicNote: 'Report received.' },
      { newStatus: ReportStatus.ASSIGNED, publicNote: 'Assigned to the electrical maintenance unit.' },
    ],
  },
  {
    referenceCode: 'CTG-2026-FAC005',
    title: 'Damaged public tap at Brikama market',
    description: 'The public tap at Brikama market is leaking continuously and cannot be shut off, wasting water and flooding the market floor.',
    category: ReportCategory.DAMAGED_FACILITY,
    location: 'Brikama market, public tap stand',
    status: ReportStatus.REJECTED,
    contactName: 'Ebrima Jobe',
    updates: [
      { newStatus: ReportStatus.SUBMITTED, publicNote: 'Report received.' },
      { newStatus: ReportStatus.REJECTED, publicNote: 'Facility falls under a different authority; redirected internally.' },
    ],
  },
  {
    referenceCode: 'CTG-2026-OTH006',
    title: 'Broken footbridge railing near Kotu',
    description: 'A section of railing on the Kotu footbridge is loose and poses a fall risk, especially for children crossing after school.',
    category: ReportCategory.OTHER,
    location: 'Kotu footbridge',
    status: ReportStatus.SUBMITTED,
    updates: [{ newStatus: ReportStatus.SUBMITTED, publicNote: 'Report received by the civic team.' }],
  },
]

async function main() {
  // Make seeding idempotent for local development demonstrations.
  await prisma.reportStatusUpdate.deleteMany()
  await prisma.report.deleteMany()

  const demoEmail = process.env.DEMO_OFFICER_EMAIL || 'officer@civictrack.gm'
  const demoPassword = process.env.DEMO_OFFICER_PASSWORD || 'DemoOfficerPass123!'
  const demoName = process.env.DEMO_OFFICER_NAME || 'Duty Officer'

  const passwordHash = await bcrypt.hash(demoPassword, 10)

  const officer = await prisma.officer.upsert({
    where: { email: demoEmail },
    update: { name: demoName, passwordHash },
    create: { name: demoName, email: demoEmail, passwordHash, role: OfficerRole.OFFICER },
  })

  for (const reportData of SAMPLE_REPORTS) {
    const { updates, ...report } = reportData
    const created = await prisma.report.create({
      data: {
        ...report,
        latitude: undefined,
        longitude: undefined,
        updates: {
          create: updates.map((u, index) => ({
            previousStatus: index === 0 ? undefined : updates[index - 1].newStatus,
            newStatus: u.newStatus,
            publicNote: u.publicNote,
            officerId: officer.id,
          })),
        },
      },
      include: { updates: true },
    })
    // eslint-disable-next-line no-console
    console.log(`Seeded report ${created.referenceCode} — ${created.title}`)
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded demo officer: ${officer.email}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
