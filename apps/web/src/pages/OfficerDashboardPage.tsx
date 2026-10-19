import { useEffect, useState } from 'react'
import {
  LayoutList,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  AlertOctagon,
  LogOut,
  FolderOpen,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Loading } from '@/components/Loading'
import { EmptyState } from '@/components/EmptyState'
import { useReports } from '@/hooks/useReports'
import { useAuth } from '@/hooks/useAuth'
import { ReportCard } from '@/components/ReportCard'

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REJECTED', label: 'Rejected' },
]

const CATEGORY_FILTERS = [
  { value: '', label: 'All Categories' },
  { value: 'BLOCKED_DRAIN', label: 'Blocked Drain' },
  { value: 'WASTE_DISPOSAL', label: 'Waste Disposal' },
  { value: 'DAMAGED_ROAD', label: 'Damaged Road' },
  { value: 'STREETLIGHT', label: 'Streetlight' },
  { value: 'DAMAGED_FACILITY', label: 'Public Facility' },
  { value: 'OTHER', label: 'Other Issue' },
]

export function OfficerDashboardPage() {
  const { user, signOut } = useAuth()
  const { getDashboardCounts, getOfficerReports, loading, error } = useReports()
  const [counts, setCounts] = useState<any>(null)
  const [reports, setReports] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getDashboardCounts().then(setCounts).catch(() => {})
  }, [getDashboardCounts])

  useEffect(() => {
    getOfficerReports({ page, pageSize: 9, search, category, status })
      .then(setReports)
      .catch(() => {})
  }, [getOfficerReports, page, search, category, status])

  const isInitialLoading = loading && !counts

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
      <Navbar isOfficer />

      <main className="flex-1 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
        {/* Operations Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-sand-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-canopy-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-river-700">
                Municipal Operations Command
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-sand-900 tracking-tight">
              Community Reports Queue
            </h1>
            <p className="text-xs sm:text-sm text-sand-600 mt-0.5">
              Logged in as <strong className="text-sand-900">{user?.name}</strong> • Operations Department
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button to="/officer/reports" variant="outline" size="sm" className="text-xs">
              <LayoutList className="w-3.5 h-3.5 mr-1" /> All Reports
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-xs text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
            </Button>
          </div>
        </header>

        {isInitialLoading && (
          <div className="py-20 flex justify-center">
            <Loading message="Loading municipal registry metrics…" />
          </div>
        )}

        {!isInitialLoading && (
          <>
            {/* KPI Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-8">
              <StatTile
                title="Total Reports"
                value={counts?.total ?? 0}
                icon={FolderOpen}
                variant="river"
                active={status === ''}
                onClick={() => {
                  setStatus('')
                  setPage(1)
                }}
              />
              <StatTile
                title="Submitted"
                value={counts?.submitted ?? 0}
                icon={Clock}
                variant="ochre"
                active={status === 'SUBMITTED'}
                onClick={() => {
                  setStatus('SUBMITTED')
                  setPage(1)
                }}
              />
              <StatTile
                title="In Progress"
                value={counts?.inProgress ?? 0}
                icon={Wrench}
                variant="amber"
                active={status === 'IN_PROGRESS'}
                onClick={() => {
                  setStatus('IN_PROGRESS')
                  setPage(1)
                }}
              />
              <StatTile
                title="Resolved"
                value={counts?.resolved ?? 0}
                icon={CheckCircle2}
                variant="canopy"
                active={status === 'RESOLVED'}
                onClick={() => {
                  setStatus('RESOLVED')
                  setPage(1)
                }}
              />
              <StatTile
                title="Rejected / Closed"
                value={counts?.rejected ?? 0}
                icon={AlertOctagon}
                variant="sand"
                active={status === 'REJECTED'}
                onClick={() => {
                  setStatus('REJECTED')
                  setPage(1)
                }}
              />
            </div>

            {error && <ErrorMessage message={error} className="mb-6" />}

            {/* Main Content Area */}
            <Card padding="none" className="shadow-card">
              {/* Filter and Search Bar */}
              <div className="p-5 border-b border-sand-200 bg-sand-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-sand-900">Registered Reports</h2>
                  <p className="text-xs text-sand-600">Filter by keyword, municipal category, or status.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search input */}
                  <div className="relative min-w-[220px] sm:min-w-[260px]">
                    <Search className="w-4 h-4 text-sand-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      className="w-full rounded-xl border border-sand-300 bg-white px-3 py-2 pl-9 text-xs text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-river-500"
                      placeholder="Search ref, title, or location…"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                    />
                  </div>

                  {/* Category filter */}
                  <select
                    className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs text-sand-900 focus:outline-none focus:ring-2 focus:ring-river-500 cursor-pointer"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      setPage(1)
                    }}
                  >
                    {CATEGORY_FILTERS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  {/* Status filter */}
                  <select
                    className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs text-sand-900 focus:outline-none focus:ring-2 focus:ring-river-500 cursor-pointer"
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value)
                      setPage(1)
                    }}
                  >
                    {STATUS_FILTERS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reports Grid */}
              <div className="p-5">
                {reports == null ? (
                  <div className="py-16 flex justify-center">
                    <Loading message="Fetching reports matching filter criteria…" />
                  </div>
                ) : reports.reports.length === 0 ? (
                  <EmptyState
                    title="No Reports Match Filters"
                    description="No infrastructure reports match your current search or category filter. Try clearing filters to see all reports."
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearch('')
                          setCategory('')
                          setStatus('')
                        }}
                      >
                        Reset All Filters
                      </Button>
                    }
                  />
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.reports.map((report: any) => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination Footer */}
              {reports && reports.total > 0 && (
                <div className="px-5 py-4 border-t border-sand-200 bg-sand-50/40 flex items-center justify-between text-xs text-sand-600">
                  <span>
                    Showing <strong className="text-sand-900">{reports.reports.length}</strong> of{' '}
                    <strong className="text-sand-900">{reports.total}</strong> reports
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      className="text-xs"
                    >
                      Previous
                    </Button>
                    <span className="font-mono px-2 text-sand-700">Page {page}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * reports.pageSize >= reports.total}
                      onClick={() => setPage(page + 1)}
                      className="text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  )
}

interface StatTileProps {
  title: string
  value: number
  icon: React.ElementType
  variant: 'river' | 'ochre' | 'amber' | 'canopy' | 'sand'
  active: boolean
  onClick: () => void
}

function StatTile({ title, value, icon: Icon, variant, active, onClick }: StatTileProps) {
  const styles: Record<string, { border: string; bg: string; text: string; iconColor: string }> = {
    river: {
      border: 'border-river-200',
      bg: 'bg-river-50/70',
      text: 'text-river-950',
      iconColor: 'text-river-700',
    },
    ochre: {
      border: 'border-ochre-200',
      bg: 'bg-ochre-50/70',
      text: 'text-ochre-950',
      iconColor: 'text-ochre-700',
    },
    amber: {
      border: 'border-amber-200',
      bg: 'bg-amber-50/70',
      text: 'text-amber-950',
      iconColor: 'text-amber-700',
    },
    canopy: {
      border: 'border-canopy-200',
      bg: 'bg-canopy-50/70',
      text: 'text-canopy-950',
      iconColor: 'text-canopy-700',
    },
    sand: {
      border: 'border-sand-200',
      bg: 'bg-sand-100/70',
      text: 'text-sand-950',
      iconColor: 'text-sand-700',
    },
  }

  const s = styles[variant]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border transition-all duration-150 ${s.bg} ${s.border} ${
        active
          ? 'ring-2 ring-river-600 shadow-sm border-river-400 bg-white'
          : 'hover:border-sand-300 hover:shadow-subtle'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-sand-500">{title}</span>
        <Icon className={`w-4 h-4 ${s.iconColor}`} />
      </div>
      <div className={`text-2xl sm:text-3xl font-extrabold ${s.text} font-mono tracking-tight`}>{value}</div>
    </button>
  )
}
