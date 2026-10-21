import { api, ApiRequestError } from '@/lib/api'
import type { PublicReport, OfficerReport, DashboardCounts, CategoryOption } from '@/types'

export const CATEGORIES: CategoryOption[] = [
  { value: 'BLOCKED_DRAIN', label: 'Blocked drain' },
  { value: 'WASTE_DISPOSAL', label: 'Improper waste disposal' },
  { value: 'DAMAGED_ROAD', label: 'Damaged road' },
  { value: 'STREETLIGHT', label: 'Streetlight problem' },
  { value: 'DAMAGED_FACILITY', label: 'Damaged public facility' },
  { value: 'OTHER', label: 'Other infrastructure issue' },
]

export type ReportStatusType =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'

export const STATUS_LABELS: Record<ReportStatusType, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
}

export interface CreateReportInput {
  title: string
  description: string
  category: string
  location?: string
  lga?: string | null
  locationId?: string | null
  customLocation?: string | null
  streetNumber: string
  latitude?: number | null
  longitude?: number | null
  contactName?: string | null
  contactPhone?: string | null
  contactEmail: string
  image?: File | null
}

export interface SubmitResult {
  referenceCode: string
  status: string
  message: string
  emailSent: boolean
  imageSent: boolean
}

export async function submitReport(data: CreateReportInput): Promise<SubmitResult> {
  const formData = new FormData()
  formData.append('title', data.title)
  formData.append('description', data.description)
  formData.append('category', data.category)
  if (data.location) formData.append('location', data.location)
  if (data.lga) formData.append('lga', data.lga)
  if (data.locationId) formData.append('locationId', data.locationId)
  if (data.customLocation) formData.append('customLocation', data.customLocation)
  formData.append('streetNumber', data.streetNumber)
  if (data.latitude !== undefined && data.latitude !== null) formData.append('latitude', String(data.latitude))
  if (data.longitude !== undefined && data.longitude !== null) formData.append('longitude', String(data.longitude))
  if (data.contactName) formData.append('contactName', data.contactName)
  if (data.contactPhone) formData.append('contactPhone', data.contactPhone)
  formData.append('contactEmail', data.contactEmail)
  if (data.image) formData.append('image', data.image)

  const res = await api.post<{ data: SubmitResult }>('/api/reports', formData)
  return res.data.data
}

export async function trackReport(referenceCode: string): Promise<PublicReport> {
  const res = await api.get<{ data: PublicReport }>(`/api/reports/track/${encodeURIComponent(referenceCode)}`)
  return res.data.data
}

export async function getCategories(): Promise<CategoryOption[]> {
  const res = await api.get<{ data: CategoryOption[] }>('/api/reports/categories')
  return res.data.data
}

export interface OfficerReportsResult {
  reports: OfficerReport[]
  total: number
  page: number
  pageSize: number
}

export async function getOfficerReports(params?: {
  page?: number
  pageSize?: number
  search?: string
  category?: string
  status?: string
  lga?: string
}): Promise<OfficerReportsResult> {
  const res = await api.get<{ data: OfficerReportsResult }>('/api/officer/reports', { params })
  return res.data.data
}

export async function getOfficerReport(id: string): Promise<OfficerReport & {
  description: string
  latitude: number | null
  longitude: number | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  updates: Array<{
    id: string
    previousStatus: string | null
    newStatus: string
    publicNote: string | null
    createdAt: string
    officerName: string | null
  }>
}> {
  const res = await api.get<{ data: any }>(`/api/officer/reports/${id}`)
  return res.data.data
}

export async function updateReportStatus(id: string, status: string, publicNote?: string | null) {
  const res = await api.patch<{ data: any }>(`/api/officer/reports/${id}/status`, {
    status,
    publicNote,
  })
  return res.data.data
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const res = await api.get<{ data: DashboardCounts }>('/api/officer/dashboard')
  return res.data.data
}

export { ApiRequestError }
