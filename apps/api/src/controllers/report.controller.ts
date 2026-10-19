import { Request, Response, NextFunction } from 'express'
import {
  createReport,
  getPublicReportByReference,
  getOfficerReports,
  getOfficerReportDetail,
  updateReportStatus,
  getDashboardCounts,
  type ValidStatus,
} from '../services/report.service'
import { AuthenticatedRequest } from '../middleware/auth'

export async function submitReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await createReport(req.body as Parameters<typeof createReport>[0])
    res.status(201).json({
      data: {
        referenceCode: report.referenceCode,
        status: report.status,
        message: 'Report submitted successfully',
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function trackReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const report = await getPublicReportByReference(req.params.reference)

    if (!report) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No report found with that reference code' },
      })
      return
    }

    // Intentionally excludes contact details and officer information.
    res.json({ data: report })
  } catch (err) {
    next(err)
  }
}

export async function listOfficerReports(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.max(1, Math.min(Number(req.query.pageSize) || 20, 100))

    const result = await getOfficerReports({
      page,
      pageSize,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
    })

    res.json({ data: result })
  } catch (err) {
    next(err)
  }
}

export async function getOfficerReport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const report = await getOfficerReportDetail(req.params.id)

    if (!report) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Report not found' } })
      return
    }

    res.json({ data: report })
  } catch (err) {
    next(err)
  }
}

export async function patchReportStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, publicNote } = req.body as { status: string; publicNote?: string | null }
    const updatedReport = await updateReportStatus({
      id: req.params.id,
      status: status as ValidStatus,
      publicNote,
      officerId: req.officer?.id ?? null,
    })

    res.json({ data: updatedReport })
  } catch (err) {
    next(err)
  }
}

export async function getDashboard(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const counts = await getDashboardCounts()
    res.json({ data: counts })
  } catch (err) {
    next(err)
  }
}
