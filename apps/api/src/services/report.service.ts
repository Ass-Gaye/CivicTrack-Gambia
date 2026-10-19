import crypto from 'crypto'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { Prisma, ReportCategory, ReportStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { CATEGORY_LABELS, STATUS_LABELS } from '../schemas/report'

export type ValidCategory = ReportCategory
export type ValidStatus = ReportStatus

/**
 * Generates a unique, human-readable reference code (CTG-YYYY-XXXXXX)
 * on the server. The database unique constraint guarantees uniqueness;
 * on a collision we regenerate and retry.
 */
export function generateReferenceCode(): string {
  const year = new Date().getFullYear()
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `CTG-${year}-${suffix}`
}

export interface PublicReport {
  referenceCode: string
  title: string
  category: string
  categoryLabel: string
  location: string
  latitude: number | null
  longitude: number | null
  status: string
  statusLabel: string
  submittedAt: string
  updates: Array<{
    id: string
    status: string
    statusLabel: string
    publicNote: string | null
    createdAt: string
  }>
}

export async function createReport(data: {
  title: string
  description: string
  category: ValidCategory
  location: string
  latitude?: number | null
  longitude?: number | null
  contactName?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
}) {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < 5; attempt++) {
    const referenceCode = generateReferenceCode()
    try {
      return await prisma.report.create({
        data: {
          referenceCode,
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
          contactName: data.contactName ?? null,
          contactPhone: data.contactPhone ?? null,
          contactEmail: data.contactEmail ?? null,
        },
        select: { referenceCode: true, status: true, createdAt: true },
      })
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        lastError = error
        continue
      }
      throw error
    }
  }
  throw lastError ?? new Error('Failed to create report after multiple attempts')
}

export async function getPublicReportByReference(referenceCode: string): Promise<PublicReport | null> {
  const report = await prisma.report.findUnique({
    where: { referenceCode },
    select: {
      referenceCode: true,
      title: true,
      category: true,
      location: true,
      latitude: true,
      longitude: true,
      status: true,
      createdAt: true,
      updates: {
        select: {
          id: true,
          newStatus: true,
          publicNote: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!report) return null

  return {
    referenceCode: report.referenceCode,
    title: report.title,
    category: report.category,
    categoryLabel: CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] ?? report.category,
    location: report.location,
    latitude: report.latitude,
    longitude: report.longitude,
    status: report.status,
    statusLabel: STATUS_LABELS[report.status as keyof typeof STATUS_LABELS] ?? report.status,
    submittedAt: report.createdAt.toISOString(),
    updates: report.updates.map((u) => ({
      id: u.id,
      status: u.newStatus,
      statusLabel: STATUS_LABELS[u.newStatus as keyof typeof STATUS_LABELS] ?? u.newStatus,
      publicNote: u.publicNote,
      createdAt: u.createdAt.toISOString(),
    })),
  }
}

export interface OfficerReport {
  id: string
  referenceCode: string
  title: string
  category: string
  categoryLabel: string
  location: string
  status: string
  statusLabel: string
  createdAt: string
  updatedAt: string
  latestNote: string | null
  latestUpdatedAt: string | null
}

export interface OfficerReportsResult {
  reports: OfficerReport[]
  total: number
  page: number
  pageSize: number
}

export async function getOfficerReports({
  page = 1,
  pageSize = 20,
  search,
  category,
  status,
}: {
  page?: number
  pageSize?: number
  search?: string | null
  category?: string | null
  status?: string | null
}): Promise<OfficerReportsResult> {
  const skip = (Math.max(1, page) - 1) * Math.max(1, Math.min(pageSize, 100))

  const where: Prisma.ReportWhereInput = {}
  if (search) {
    where.OR = [
      { referenceCode: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ]
  }
  const validCategories = Object.values(ReportCategory)
  const validStatuses = Object.values(ReportStatus)
  if (category && validCategories.includes(category as ValidCategory)) {
    where.category = category as ValidCategory
  }
  if (status && validStatuses.includes(status as ValidStatus)) {
    where.status = status as ValidStatus
  }

  const [reports, total] = await prisma.$transaction([
    prisma.report.findMany({
      where,
      select: {
        id: true,
        referenceCode: true,
        title: true,
        category: true,
        location: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        updates: {
          select: { publicNote: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Math.min(pageSize, 100),
    }),
    prisma.report.count({ where }),
  ])

  return {
    reports: reports.map((r) => ({
      id: r.id,
      referenceCode: r.referenceCode,
      title: r.title,
      category: r.category,
      categoryLabel: CATEGORY_LABELS[r.category as keyof typeof CATEGORY_LABELS] ?? r.category,
      location: r.location,
      status: r.status,
      statusLabel: STATUS_LABELS[r.status as keyof typeof STATUS_LABELS] ?? r.status,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      latestNote: r.updates[0]?.publicNote ?? null,
      latestUpdatedAt: r.updates[0]?.createdAt.toISOString() ?? null,
    })),
    total,
    page: Math.max(1, page),
    pageSize: Math.min(pageSize, 100),
  }
}

export async function getOfficerReportDetail(id: string) {
  const report = await prisma.report.findUnique({
    where: { id },
    select: {
      id: true,
      referenceCode: true,
      title: true,
      description: true,
      category: true,
      location: true,
      latitude: true,
      longitude: true,
      contactName: true,
      contactPhone: true,
      contactEmail: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      updates: {
        select: {
          id: true,
          previousStatus: true,
          newStatus: true,
          publicNote: true,
          createdAt: true,
          officer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!report) return null

  return {
    ...report,
    categoryLabel: CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] ?? report.category,
    statusLabel: STATUS_LABELS[report.status as keyof typeof STATUS_LABELS] ?? report.status,
  }
}

export async function updateReportStatus({
  id,
  status,
  publicNote,
  officerId,
}: {
  id: string
  status: ValidStatus
  publicNote?: string | null
  officerId?: string | null
}) {
  await prisma.$transaction(async (tx) => {
    const report = await tx.report.findUnique({ where: { id } })
    if (!report) {
      const err: Error & { statusCode?: number } = new Error('Report not found')
      err.statusCode = 404
      throw err
    }

    const previousStatus = report.status
    await tx.report.update({
      where: { id },
      data: { status },
    })
    await tx.reportStatusUpdate.create({
      data: {
        reportId: id,
        previousStatus,
        newStatus: status,
        publicNote: publicNote ?? null,
        officerId: officerId ?? null,
      },
    })
  })

  return getOfficerReportDetail(id)
}

export async function getDashboardCounts() {
  const [total, byStatus] = await prisma.$transaction([
    prisma.report.count(),
    prisma.report.groupBy({
      by: ['status'],
      _count: { status: true },
      orderBy: { status: 'asc' },
    }),
  ])

  const counts: Record<string, number> = {
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    REJECTED: 0,
  }
  for (const row of byStatus) {
    const count = (row._count as { status: number })?.status ?? 0
    counts[row.status] = (counts[row.status] ?? 0) + count
  }

  return {
    total,
    submitted: counts.SUBMITTED,
    underReview: counts.UNDER_REVIEW,
    assigned: counts.ASSIGNED,
    inProgress: counts.IN_PROGRESS,
    resolved: counts.RESOLVED,
    rejected: counts.REJECTED,
  }
}
