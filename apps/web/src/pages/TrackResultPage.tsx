import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  MapPin,
  Calendar,
  Compass,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  Wrench,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { SectionTitle } from '@/components/SectionTitle'
import { Loading } from '@/components/Loading'
import { StatusBadge } from '@/components/StatusBadge'
import { Timeline } from '@/components/Timeline'
import { useReports, type PublicReport } from '@/hooks/useReports'
import { EmptyState } from '@/components/EmptyState'

// Visual 4-stage pipeline for civic issues
const PIPELINE_STAGES = [
  { key: 'SUBMITTED', label: '1. Received', icon: Clock },
  { key: 'UNDER_REVIEW', label: '2. Triaged', icon: Eye },
  { key: 'IN_PROGRESS', label: '3. In Progress', icon: Wrench },
  { key: 'RESOLVED', label: '4. Resolved', icon: CheckCircle2 },
]

export function TrackResultPage() {
  const { reference } = useParams<{ reference: string }>()
  const [report, setReport] = useState<PublicReport | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const { trackReport, loading } = useReports()

  useEffect(() => {
    if (!reference) return
    let cancelled = false
    trackReport(decodeURIComponent(reference))
      .then((r) => {
        if (!cancelled) {
          setReport(r)
          setNotFound(false)
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setNotFound(err?.status === 404)
          setReport(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [reference, trackReport])

  const copyCode = () => {
    if (!report) return
    navigator.clipboard.writeText(report.referenceCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Determine active stage index for the progress bar
  const getStageIndex = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 0
      case 'UNDER_REVIEW':
      case 'ASSIGNED':
        return 1
      case 'IN_PROGRESS':
        return 2
      case 'RESOLVED':
        return 3
      case 'REJECTED':
        return -1
      default:
        return 0
    }
  }

  const activeStage = report ? getStageIndex(report.status) : 0

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full">
        {/* Navigation Actions */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            to="/track"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sand-600 hover:text-river-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Track Another Report
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Status
          </Button>
        </div>

        {loading && !report && (
          <Card padding="lg">
            <Loading message="Fetching live records from municipal database…" />
          </Card>
        )}

        {notFound && !report && (
          <Card padding="lg" className="border-red-200">
            <EmptyState
              title="Report Reference Not Found"
              description={`We could not locate any public report under "${reference}". Please verify the code or check with your municipal office.`}
              icon={AlertOctagon}
              action={
                <Button to="/track" variant="primary" size="md">
                  Try Another Code
                </Button>
              }
            />
          </Card>
        )}

        {report && (
          <div className="space-y-6">
            {/* Main Report Card */}
            <Card padding="lg" className="shadow-card">
              {/* Header with Reference & Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-sand-200">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-sand-500">Ref Code:</span>
                  <span className="font-mono text-lg sm:text-xl font-black text-river-900 bg-sand-100 px-3 py-1 rounded-lg border border-sand-200">
                    {report.referenceCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-1.5 rounded-lg text-sand-600 hover:bg-sand-100 hover:text-river-900 transition-colors"
                    title="Copy reference code"
                  >
                    {copied ? <Check className="w-4 h-4 text-canopy-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <StatusBadge status={report.status} />
              </div>

              {/* Title & Location */}
              <div className="py-5">
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-river-700 bg-river-50 border border-river-200/80 px-2.5 py-0.5 rounded-md mb-2">
                  {report.categoryLabel}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight mb-2">
                  {report.title}
                </h1>
                <div className="flex items-center gap-1.5 text-sm text-sand-600">
                  <MapPin className="w-4 h-4 text-ochre-600 flex-shrink-0" />
                  <span>{report.location}</span>
                </div>
              </div>

              {/* Visual 4-Stage Progress Bar */}
              {report.status !== 'REJECTED' ? (
                <div className="my-4 pt-4 border-t border-sand-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-sand-500 block mb-3">
                    Municipal Pipeline Progression
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {PIPELINE_STAGES.map((stg, idx) => {
                      const isComplete = idx <= activeStage
                      const isCurrent = idx === activeStage
                      const Icon = stg.icon

                      return (
                        <div key={stg.key} className="flex flex-col items-center">
                          <div
                            className={`w-full h-1.5 rounded-full mb-2 transition-all ${
                              isComplete ? 'bg-canopy-600' : 'bg-sand-200'
                            }`}
                          />
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs mb-1 transition-all ${
                              isCurrent
                                ? 'bg-river-900 text-white ring-4 ring-river-100'
                                : isComplete
                                  ? 'bg-canopy-100 text-canopy-700 font-bold'
                                  : 'bg-sand-100 text-sand-400'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span
                            className={`text-[11px] font-semibold leading-tight ${
                              isCurrent ? 'text-river-900 font-bold' : isComplete ? 'text-sand-800' : 'text-sand-400'
                            }`}
                          >
                            {stg.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="my-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  <strong>Notice:</strong> This report was marked as rejected or closed by municipal staff. See the
                  timeline below for explanation notes.
                </div>
              )}

              {/* Data Tokens Grid */}
              <div className="mt-4 pt-4 border-t border-sand-200 grid sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80">
                  <span className="text-sand-500 font-medium block mb-1">Date Submitted</span>
                  <div className="flex items-center gap-1.5 font-semibold text-sand-900">
                    <Calendar className="w-3.5 h-3.5 text-sand-500" />
                    <span>
                      {new Date(report.submittedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80">
                  <span className="text-sand-500 font-medium block mb-1">GPS Coordinates</span>
                  <div className="flex items-center gap-1.5 font-semibold text-sand-900 font-mono">
                    <Compass className="w-3.5 h-3.5 text-sand-500" />
                    <span>
                      {report.latitude && report.longitude
                        ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`
                        : 'Not provided'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sand-50 border border-sand-200/80">
                  <span className="text-sand-500 font-medium block mb-1">Updates Logged</span>
                  <div className="flex items-center gap-1.5 font-semibold text-sand-900">
                    <Clock className="w-3.5 h-3.5 text-sand-500" />
                    <span>{report.updates.length} official updates</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Official Progress Timeline Card */}
            <Card padding="lg" className="shadow-card">
              <SectionTitle
                eyebrow="Audit Trail"
                title="Progress History & Officer Notes"
                description="Chronological log of inspections, crew assignments, and work completion notes."
              />
              <Timeline updates={report.updates} submittedAt={report.submittedAt} />
            </Card>

            {/* Citizen Privacy Disclaimer */}
            <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-subtle flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-canopy-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-sand-600 leading-relaxed">
                <strong className="text-sand-900">Citizen Privacy Protected:</strong> Only public works descriptions
                and municipal progress notes are shown here. Private contact details are restricted to authorized
                council officers.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
