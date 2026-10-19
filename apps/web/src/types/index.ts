export type ReportCategory =
  | 'BLOCKED_DRAIN'
  | 'WASTE_DISPOSAL'
  | 'DAMAGED_ROAD'
  | 'STREETLIGHT'
  | 'DAMAGED_FACILITY'
  | 'OTHER'

export type ReportStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'

export interface ReportUpdate {
  id: string
  status: ReportStatus
  statusLabel: string
  publicNote: string | null
  createdAt: string
}

export interface PublicReport {
  referenceCode: string
  title: string
  category: ReportCategory
  categoryLabel: string
  location: string
  latitude: number | null
  longitude: number | null
  status: ReportStatus
  statusLabel: string
  submittedAt: string
  updates: ReportUpdate[]
}

export interface OfficerReport {
  id: string
  referenceCode: string
  title: string
  category: ReportCategory
  categoryLabel: string
  location: string
  status: ReportStatus
  statusLabel: string
  createdAt: string
  updatedAt: string
  latestNote: string | null
  latestUpdatedAt: string | null
}

export interface Officer {
  id: string
  name: string
  email: string
  role: string
}

export interface DashboardCounts {
  total: number
  submitted: number
  underReview: number
  assigned: number
  inProgress: number
  resolved: number
  rejected: number
}

export interface CategoryOption {
  value: ReportCategory
  label: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}
