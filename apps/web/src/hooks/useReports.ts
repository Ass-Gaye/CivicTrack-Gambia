import { useState, useCallback } from 'react'
import {
  submitReport as svcSubmitReport,
  trackReport as svcTrackReport,
  getCategories as svcGetCategories,
  getOfficerReports as svcGetOfficerReports,
  getOfficerReport as svcGetOfficerReport,
  updateReportStatus as svcUpdateReportStatus,
  getDashboardCounts as svcGetDashboardCounts,
  type OfficerReportsResult,
  ApiRequestError,
} from '@/services/reports'
import type { PublicReport, OfficerReport, DashboardCounts } from '@/types'

export function useReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAsyncError = useCallback((err: unknown) => {
    if (err instanceof ApiRequestError) {
      setError(err.error.message || `Request failed (${err.status})`)
    } else if (err instanceof Error) {
      setError(err.message)
    } else {
      setError('An unexpected error occurred')
    }
  }, [])

  const submitReport = useCallback(async (data: Parameters<typeof svcSubmitReport>[0]) => {
    setLoading(true)
    setError(null)
    try {
      const result = await svcSubmitReport(data)
      return result
    } catch (err) {
      setAsyncError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setAsyncError])

  const trackReport = useCallback(async (referenceCode: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await svcTrackReport(referenceCode)
      return result
    } catch (err) {
      setAsyncError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setAsyncError])

  const getCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      return await svcGetCategories()
    } catch (err) {
      setAsyncError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setAsyncError])

  const getOfficerReports = useCallback(async (params?: Parameters<typeof svcGetOfficerReports>[0]) => {
    setLoading(true)
    setError(null)
    try {
      const result: OfficerReportsResult = await svcGetOfficerReports(params)
      return result
    } catch (err) {
      setAsyncError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setAsyncError])

  const getOfficerReport = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      return await svcGetOfficerReport(id)
    } catch (err) {
      setAsyncError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setAsyncError])

  const updateReportStatus = useCallback(async (id: string, status: string, publicNote?: string | null) => {
    setLoading(true)
    setError(null)
    try {
      const result = await svcUpdateReportStatus(id, status, publicNote)
      return result
    } catch (err) {
      setAsyncError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setAsyncError])

  const getDashboardCounts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result: DashboardCounts = await svcGetDashboardCounts()
      return result
    } catch (err) {
      setAsyncError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [setAsyncError])

  return {
    loading,
    error,
    setError,
    submitReport,
    trackReport,
    getCategories,
    getOfficerReports,
    getOfficerReport,
    updateReportStatus,
    getDashboardCounts,
  }
}

export type { PublicReport, OfficerReport, DashboardCounts, OfficerReportsResult, ApiRequestError }
