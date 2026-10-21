import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Lock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { SectionTitle } from '@/components/SectionTitle'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Loading } from '@/components/Loading'
import { StatusBadge } from '@/components/StatusBadge'
import { EmptyState } from '@/components/EmptyState'
import { Timeline } from '@/components/Timeline'
import { useReports } from '@/hooks/useReports'
import { STATUS_LABELS, type ReportStatusType } from '@/services/reports'

const STATUSES = [
  { value: 'SUBMITTED', label: 'Submitted (Logged)' },
  { value: 'UNDER_REVIEW', label: 'Under Review (Assessing)' },
  { value: 'ASSIGNED', label: 'Assigned (Dispatched)' },
  { value: 'IN_PROGRESS', label: 'In Progress (Work underway)' },
  { value: 'RESOLVED', label: 'Resolved (Work completed)' },
  { value: 'REJECTED', label: 'Rejected (Out of scope / duplicate)' },
]

export function OfficerReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getOfficerReport, updateReportStatus, loading, error } = useReports()

  const [report, setReport] = useState<any>(null)
  const [newStatus, setNewStatus] = useState('')
  const [publicNote, setPublicNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [successNotice, setSuccessNotice] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getOfficerReport(id)
      .then((r) => {
        if (!cancelled) {
          setReport(r)
          setNewStatus(r.status)
        }
      })
      .catch(() => {
        if (!cancelled) setReport(null)
      })
    return () => {
      cancelled = true
    }
  }, [id, getOfficerReport])

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!id || !newStatus) return
    setUpdating(true)
    setSuccessNotice(false)
    try {
      const updated = await updateReportStatus(id, newStatus, publicNote || null)
      if (updated && Array.isArray(updated.updates)) {
        setReport(updated)
      } else {
        const fresh = await getOfficerReport(id)
        setReport(fresh)
      }
      setPublicNote('')
      setSuccessNotice(true)
      setTimeout(() => setSuccessNotice(false), 4000)
    } catch {
      // error set by hook
    } finally {
      setUpdating(false)
    }
  }

  if (loading && !report) {
    return (
      <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
        <Navbar isOfficer />
        <div className="flex-1 flex items-center justify-center py-20">
          <Loading message="Loading report dossier from municipal records…" />
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
        <Navbar isOfficer />
        <main className="flex-1 max-w-md mx-auto py-16 px-4 w-full">
          <Card padding="lg" className="border-red-200">
            <EmptyState
              title="Report Dossier Not Found"
              description="The requested report does not exist in the municipal database."
              icon={AlertCircle}
              action={
                <Button to="/officer/reports" variant="primary" size="md">
                  Return to Reports Queue
                </Button>
              }
            />
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
      <Navbar isOfficer />

      <main className="flex-1 max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/officer/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sand-600 hover:text-river-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Reports Queue
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold bg-sand-200/80 px-2.5 py-1 rounded-lg text-sand-800">
              ID: {report.id.substring(0, 8)}...
            </span>
          </div>
        </div>

        {/* Dossier Overview Card */}
        <Card padding="lg" className="shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-sand-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-sand-500">Official Reference</span>
                <span className="font-mono text-base font-black text-river-900 bg-sand-100 px-2.5 py-0.5 rounded border border-sand-200">
                  {report.referenceCode}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-sand-900 tracking-tight">{report.title}</h1>
            </div>
            <StatusBadge status={report.status} />
          </div>

          {/* Key Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4 border-b border-sand-200 text-xs">
            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80">
              <span className="text-sand-500 font-medium block mb-1">Category</span>
              <span className="font-bold text-sand-900">{report.categoryLabel}</span>
            </div>
            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80">
              <span className="text-sand-500 font-medium block mb-1">Region / LGA</span>
              <span className="font-bold text-sand-900 truncate block" title={report.lgaName || 'Not specified'}>
                {report.lgaName || 'Not specified'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80">
              <span className="text-sand-500 font-medium block mb-1">Location</span>
              <span className="font-bold text-sand-900 flex items-center gap-1 truncate" title={report.location}>
                <MapPin className="w-3.5 h-3.5 text-ochre-600 flex-shrink-0" />
                <span className="truncate">
                  {report.streetNumber ? `${report.streetNumber}, ` : ''}{report.location}
                </span>
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80">
              <span className="text-sand-500 font-medium block mb-1">Filed Date</span>
              <span className="font-bold text-sand-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sand-500" />
                {new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80">
              <span className="text-sand-500 font-medium block mb-1">Last Updated</span>
              <span className="font-bold text-sand-900 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sand-500" />
                {new Date(report.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="py-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sand-500 block mb-2">
              Citizen's Description of Problem
            </span>
            <div className="rounded-xl bg-sand-50 border border-sand-200/90 p-4 text-sm text-sand-800 leading-relaxed font-sans whitespace-pre-wrap">
              {report.description}
            </div>
          </div>

          {/* Confidential Citizen Contact Info */}
          {(report.contactName || report.contactPhone || report.contactEmail) && (
            <div className="mt-4 pt-4 border-t border-sand-200">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-ochre-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-ochre-800">
                  Citizen Contact (Confidential — Municipal Staff Only)
                </span>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {report.contactName && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-sand-200 text-xs text-sand-800">
                    <User className="w-3.5 h-3.5 text-sand-400" />
                    <span>
                      <strong className="text-sand-900">Name:</strong> {report.contactName}
                    </span>
                  </div>
                )}
                {report.contactPhone && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-sand-200 text-xs text-sand-800">
                    <Phone className="w-3.5 h-3.5 text-sand-400" />
                    <span>
                      <strong className="text-sand-900">Phone:</strong> {report.contactPhone}
                    </span>
                  </div>
                )}
                {report.contactEmail && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-sand-200 text-xs text-sand-800">
                    <Mail className="w-3.5 h-3.5 text-sand-400" />
                    <span>
                      <strong className="text-sand-900">Email:</strong> {report.contactEmail}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Status Update Action Card */}
        <Card padding="lg" className="border-river-200 shadow-card">
          <SectionTitle
            eyebrow="Action"
            title="Dispatch & Update Status"
            description="Advance this report along the municipal workflow and provide an official public progress note."
          />

          {error && <ErrorMessage message={error} className="mb-4" />}

          {successNotice && (
            <div className="p-3.5 rounded-xl bg-canopy-50 border border-canopy-200 text-xs font-semibold text-canopy-800 flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-canopy-600" />
              <span>Status successfully updated and published to citizen tracking page.</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sand-700 mb-1.5">
                  New Status *
                </label>
                <select
                  className="block w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2.5 text-sm text-sand-900 focus:outline-none focus:ring-2 focus:ring-river-500 cursor-pointer font-medium"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="">Select a status to assign</option>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-sand-500">
                  Select the appropriate operational milestone for this issue.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-sand-700 mb-1.5">
                  Public Progress Note (Visible to Citizen)
                </label>
                <textarea
                  className="block w-full rounded-xl border border-sand-300 bg-white px-3.5 py-2 text-sm text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-river-500"
                  rows={3}
                  value={publicNote}
                  onChange={(e) => setPublicNote(e.target.value)}
                  placeholder="e.g. Drainage inspection team deployed; clearing begun on western gutter."
                />
                <p className="mt-1 text-xs text-sand-500">
                  This note will be visible to citizens tracking this reference code.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                disabled={updating || !newStatus}
              >
                <Send className="w-4 h-4 mr-1.5" />
                {updating ? 'Saving Status Update…' : 'Publish Status Update'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Audit History Timeline */}
        <Card padding="lg" className="shadow-card">
          <SectionTitle
            eyebrow="Milestones"
            title="Operational Audit Trail"
            description="Chronological log of status transitions and inspector notes recorded on this report."
          />
          <Timeline
            updates={(report.updates || []).map((u: any) => ({
              id: u.id,
              status: u.newStatus,
              statusLabel: STATUS_LABELS[u.newStatus as ReportStatusType] || String(u.newStatus),
              publicNote: u.publicNote,
              createdAt: u.createdAt,
            }))}
            submittedAt={report.createdAt}
          />
        </Card>
      </main>
    </div>
  )
}
