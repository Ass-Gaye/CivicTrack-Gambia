import { z } from 'zod'
import { ReportCategory, ReportStatus } from '@prisma/client'

const optionalCoordinate = z
  .preprocess(
    (value) => {
      if (value === '' || value === undefined || value === null) return undefined
      const parsed = Number(value)
      return Number.isNaN(parsed) ? undefined : parsed
    },
    z.number().optional()
  )
  .refine((value) => value === undefined || (value >= -90 && value <= 90), {
    message: 'Latitude must be between -90 and 90',
  })

import { validateLocation } from '../services/location.service'

export const createReportSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(2000),
    category: z.nativeEnum(ReportCategory, {
      errorMap: () => ({ message: 'Please select a valid issue category' }),
    }),
    location: z.string().trim().max(200).optional().default(''),
    lga: z.string().trim().max(100).optional().nullable(),
    locationId: z.string().trim().max(100).optional().nullable(),
    customLocation: z.string().trim().max(200).optional().nullable(),
    streetNumber: z
      .string()
      .trim()
      .min(1, 'Street number is required')
      .max(100, 'Street number must be at most 100 characters'),
    latitude: optionalCoordinate,
    longitude: optionalCoordinate
      .refine((value) => value === undefined || (value >= -180 && value <= 180), {
        message: 'Longitude must be between -180 and 180',
      }),
    contactName: z.string().trim().max(100).optional().nullable(),
    contactPhone: z.string().trim().max(50).optional().nullable(),
    contactEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email('Enter a valid email address')
      .max(150, 'Email address must be at most 150 characters'),
  })
  .superRefine((data, ctx) => {
    const valResult = validateLocation({
      lga: data.lga,
      locationId: data.locationId,
      location: data.location,
      customLocation: data.customLocation,
    })

    if (!valResult.valid) {
      if (data.locationId === 'OTHER' && !data.customLocation && !data.location) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: valResult.error || 'Please provide a specific location for Other / Not listed',
          path: ['customLocation'],
        })
      } else if (data.lga && !valResult.lga) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: valResult.error || 'Invalid Region / Local Government Area',
          path: ['lga'],
        })
      } else if (data.locationId && !valResult.locationItem && data.locationId !== 'OTHER') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: valResult.error || 'Invalid location selection',
          path: ['locationId'],
        })
      } else {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: valResult.error || 'Please provide a valid location',
          path: ['location'],
        })
      }
    }
  })

export const referenceCodeParams = z.object({
  reference: z.string().trim().min(1, 'Reference code is required'),
})

export const updateStatusSchema = z.object({
  status: z.nativeEnum(ReportStatus, {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }),
  publicNote: z.string().trim().max(1000).optional().nullable(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  BLOCKED_DRAIN: 'Blocked drain',
  WASTE_DISPOSAL: 'Improper waste disposal',
  DAMAGED_ROAD: 'Damaged road',
  STREETLIGHT: 'Streetlight problem',
  DAMAGED_FACILITY: 'Damaged public facility',
  OTHER: 'Other infrastructure issue',
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
}
