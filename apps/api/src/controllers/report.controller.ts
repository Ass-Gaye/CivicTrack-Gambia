import { Request, Response, NextFunction } from 'express'
import {
  createReport,
  getContactEmailByReference,
  getPublicReportByReference,
  getOfficerReports,
  getOfficerReportDetail,
  updateReportStatus,
  getDashboardCounts,
  type ValidStatus,
} from '../services/report.service'
import { CATEGORY_LABELS } from '../schemas/report'
import { sendConfirmationEmail } from '../services/email.service'
import { uploadImage, getCloudinary } from '../services/cloudinary.service'
import { AuthenticatedRequest } from '../middleware/auth'

/**
 * Builds the public tracking URL for a report using the configured public
 * frontend URL. Server-side only: FRONTEND_URL is never exposed to the browser.
 */
function buildTrackingUrl(referenceCode: string): string {
  const frontendUrl = process.env.FRONTEND_URL
  const base = frontendUrl ? frontendUrl.replace(/\/$/, '') : ''
  return base ? `${base}/track/${encodeURIComponent(referenceCode)}` : `/track/${encodeURIComponent(referenceCode)}`
}

export async function submitReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Validate and upload image (if provided) to Cloudinary first.
    //    Image upload failure does not block report submission — we capture
    //    the error and continue without an image.
    let imageUrl: string | null = null
    let imageKey: string | null = null

    if (req.file) {
      try {
        const uploadResult = await uploadImage(req.file)
        imageUrl = uploadResult.url
        imageKey = uploadResult.publicId
      } catch {
        // Image upload failed — continue without image.
        // The report will still be saved.
      }
    }

    // 2. Persist the report (with image info if available).
    const data = req.body as Parameters<typeof createReport>[0]
    const report = await createReport({
      ...data,
      imageUrl,
      imageKey,
    })

    // 3. Attempt confirmation email delivery. Any failure is captured and
    //    reported as emailSent: false — it never deletes the report, never
    //    creates a duplicate, and never turns a saved report into a failure.
    const trackingUrl = buildTrackingUrl(report.referenceCode)
    const emailResult = await sendConfirmationEmail({
      to: data.contactEmail,
      referenceCode: report.referenceCode,
      title: data.title,
      categoryLabel:
        CATEGORY_LABELS[data.category as keyof typeof CATEGORY_LABELS] ?? data.category,
      location: report.location,
      trackingUrl,
    })

    const emailSent = Boolean(emailResult.accepted)

    res.status(201).json({
      data: {
        referenceCode: report.referenceCode,
        status: report.status,
        imageSent: Boolean(imageUrl),
        emailSent,
        message: emailSent
          ? 'Report submitted successfully. A confirmation email has been sent to your inbox.'
          : 'Report submitted successfully, but the confirmation email could not be sent. Please save your reference code above — you will need it to track your report.',
      },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Re-sends the confirmation email for an existing report. Public, rate-limited
 * endpoint used when a citizen did not receive (or lost) the original email.
 * Only the stored contact address is used — citizens cannot supply an
 * arbitrary recipient, HTML, or sender address.
 */
export async function resendConfirmation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { reference } = req.params as { reference: string }

    const report = await getPublicReportByReference(reference)
    if (!report) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No report found with that reference code' },
      })
      return
    }

    const contactEmail = await getContactEmailByReference(reference)
    if (!contactEmail) {
      res.status(400).json({
        error: {
          code: 'NO_EMAIL_ON_FILE',
          message: 'No confirmation email can be resent for this report.',
        },
      })
      return
    }

    const trackingUrl = buildTrackingUrl(reference)
    const emailResult = await sendConfirmationEmail({
      to: contactEmail,
      referenceCode: report.referenceCode,
      title: report.title,
      categoryLabel:
        CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] ?? report.category,
      location: report.location,
      trackingUrl,
    })

    const emailSent = Boolean(emailResult.accepted)
    res.json({
      data: {
        referenceCode: report.referenceCode,
        emailSent,
        message: emailSent
          ? 'Confirmation email sent to the address on file.'
          : 'The confirmation email could not be sent. Please save your reference code.',
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
      lga: typeof req.query.lga === 'string' ? req.query.lga : undefined,
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
