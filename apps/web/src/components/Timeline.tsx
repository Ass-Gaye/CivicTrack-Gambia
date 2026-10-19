import type { ReportUpdate } from '@/types'
import { CheckCircle2, MessageSquare, Clock, ArrowUpRight } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

interface TimelineProps {
  updates: ReportUpdate[]
  submittedAt: string
}

export function Timeline({ updates, submittedAt }: TimelineProps) {
  const events = [
    {
      status: 'SUBMITTED',
      statusLabel: 'Report Logged in System',
      publicNote: 'Citizen report recorded with unique reference code.',
      createdAt: submittedAt,
    },
    ...updates,
  ]

  return (
    <div className="relative pl-2 sm:pl-4 space-y-6">
      {/* Continuous vertical timeline track */}
      <div className="absolute left-[19px] sm:left-[27px] top-4 bottom-4 w-0.5 bg-sand-200" aria-hidden="true" />

      {events.map((event, index) => {
        const isLatest = index === events.length - 1
        const isResolved = event.status === 'RESOLVED'

        return (
          <div key={event.createdAt + index} className="relative flex items-start gap-4">
            {/* Milestone icon marker */}
            <div
              className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                isResolved
                  ? 'border-canopy-600 bg-canopy-50 text-canopy-700 shadow-sm'
                  : isLatest
                    ? 'border-river-600 bg-river-50 text-river-800 ring-4 ring-river-50'
                    : 'border-sand-300 bg-white text-sand-500'
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="w-4 h-4 text-canopy-600" />
              ) : isLatest ? (
                <ArrowUpRight className="w-4 h-4 text-river-700" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-sand-400" />
              )}
            </div>

            {/* Event content box */}
            <div className="flex-1 bg-white border border-sand-200/80 rounded-xl p-4 shadow-subtle hover:border-sand-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-sand-900">{event.statusLabel}</h4>
                  <StatusBadge status={event.status} showIcon={false} className="text-[11px] py-0.5" />
                </div>
                <time className="font-mono text-xs text-sand-500 font-medium">
                  {new Date(event.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>

              {event.publicNote && (
                <div className="mt-2.5 rounded-lg bg-sand-50 border border-sand-200/70 p-3 text-sm text-sand-800 flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-river-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-xs sm:text-sm leading-relaxed">
                    <span className="font-semibold text-sand-900 block text-xs uppercase tracking-wider text-sand-500 mb-0.5">
                      Public Update Note
                    </span>
                    {event.publicNote}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
