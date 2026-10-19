import { Link } from 'react-router-dom'
import { ChevronRight, MapPin, Calendar } from 'lucide-react'
import type { OfficerReport } from '@/types'
import { StatusBadge } from './StatusBadge'

interface ReportCardProps {
  report: OfficerReport
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <Link to={`/officer/reports/${report.id}`} className="block group">
      <div className="h-full rounded-2xl border border-sand-200/90 bg-white p-5 shadow-card hover:shadow-hover hover:border-river-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-sand-500 bg-sand-100 px-2 py-0.5 rounded-md">
              {report.categoryLabel}
            </span>
            <StatusBadge status={report.status} />
          </div>

          <h3 className="text-base font-bold text-sand-900 mb-1.5 group-hover:text-river-700 transition-colors line-clamp-2">
            {report.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-sand-600 mb-4">
            <MapPin className="w-3.5 h-3.5 text-sand-400 flex-shrink-0" />
            <span className="truncate">{report.location}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-sand-100 flex items-center justify-between text-xs">
          <span className="font-mono font-semibold text-sand-700 bg-sand-50 px-2 py-0.5 rounded border border-sand-200">
            {report.referenceCode}
          </span>
          <div className="flex items-center gap-2 text-sand-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
            <ChevronRight className="w-4 h-4 text-sand-400 group-hover:text-river-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  )
}
